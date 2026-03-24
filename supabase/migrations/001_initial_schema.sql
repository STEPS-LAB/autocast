-- ─── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enums ────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- ─── Categories ───────────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name_ua     TEXT NOT NULL,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ─── Brands ───────────────────────────────────────────────────────
CREATE TABLE brands (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL UNIQUE,
  logo_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT NOT NULL UNIQUE,
  name_ua         TEXT NOT NULL,
  description_ua  TEXT NOT NULL DEFAULT '',
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  sale_price      NUMERIC(10,2) CHECK (sale_price >= 0),
  stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id        UUID REFERENCES brands(id) ON DELETE SET NULL,
  specs           JSONB NOT NULL DEFAULT '{}',
  images          TEXT[] NOT NULL DEFAULT '{}',
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING GIN(name_ua gin_trgm_ops);

-- Update search vector on insert/update
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', NEW.name_ua), 'A') ||
    setweight(to_tsvector('simple', NEW.description_ua), 'B');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_product_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- ─── Car compatibility ────────────────────────────────────────────
CREATE TABLE car_makes (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE car_models (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make_id  UUID NOT NULL REFERENCES car_makes(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  UNIQUE(make_id, name)
);

CREATE TABLE car_engines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id      UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
  displacement  TEXT NOT NULL,
  fuel_type     TEXT NOT NULL
);

CREATE TABLE product_compatibility (
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  make_id     UUID NOT NULL REFERENCES car_makes(id) ON DELETE CASCADE,
  model_id    UUID REFERENCES car_models(id) ON DELETE CASCADE,
  year_from   INT,
  year_to     INT
);

-- Allow one compatibility row for (product, make, model),
-- treating NULL model_id as a single bucket.
CREATE UNIQUE INDEX idx_product_compatibility_unique
  ON product_compatibility (
    product_id,
    make_id,
    COALESCE(model_id, '00000000-0000-0000-0000-000000000000'::UUID)
  );

-- ─── Profiles (extends auth.users) ───────────────────────────────
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              user_role NOT NULL DEFAULT 'user',
  phone             TEXT,
  delivery_address  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Orders ───────────────────────────────────────────────────────
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status         order_status NOT NULL DEFAULT 'pending',
  total          NUMERIC(10,2) NOT NULL,
  shipping_info  JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  qty         INT NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─── Row Level Security ───────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read on catalog
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Public read brands" ON brands FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Public read car_makes" ON car_makes FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Public read car_models" ON car_models FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Public read car_engines" ON car_engines FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Public read compatibility" ON product_compatibility FOR SELECT TO anon, authenticated USING (TRUE);

-- Profiles — own row only
CREATE POLICY "Profiles: read own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Orders — own only
CREATE POLICY "Orders: read own" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Orders: insert own" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders: read anon" ON orders FOR SELECT TO anon USING (user_id IS NULL);
CREATE POLICY "Orders: insert anon" ON orders FOR INSERT TO anon WITH CHECK (user_id IS NULL);

CREATE POLICY "OrderItems: read own" ON order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "OrderItems: insert own" ON order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "OrderItems: read anon" ON order_items FOR SELECT TO anon
  USING (order_id IN (SELECT id FROM orders WHERE user_id IS NULL));
CREATE POLICY "OrderItems: insert anon" ON order_items FOR INSERT TO anon
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id IS NULL));

-- Admin full access (via service role — no RLS bypassed in client)
-- Admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE POLICY "Admin write categories" ON categories FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin write brands" ON brands FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin write products" ON products FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin read all orders" ON orders FOR SELECT TO authenticated USING (is_admin() OR auth.uid() = user_id);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin read profiles" ON profiles FOR SELECT TO authenticated USING (is_admin() OR auth.uid() = id);
