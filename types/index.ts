// ─── Category ──────────────────────────────────────────────────────
export interface Category {
  id: string
  slug: string
  name_ua: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  children?: Category[]
}

// ─── Brand ─────────────────────────────────────────────────────────
export interface Brand {
  id: string
  name: string
  logo_url: string | null
}

// ─── Product ───────────────────────────────────────────────────────
export interface Product {
  id: string
  slug: string
  name_ua: string
  description_ua: string
  price: number
  sale_price: number | null
  stock: number
  category_id: string
  brand_id: string | null
  specs: Record<string, string>
  images: string[]
  video_urls?: string[]
  is_featured: boolean
  created_at: string
  category?: Category
  brand?: Brand
}

export interface ProductCard {
  id: string
  slug: string
  name_ua: string
  price: number
  sale_price: number | null
  images: string[]
  stock: number
  category?: { name_ua: string; slug: string }
  brand?: { name: string }
}

// ─── Car search ────────────────────────────────────────────────────
export interface CarMake {
  id: string
  name: string
}

export interface CarModel {
  id: string
  make_id: string
  name: string
}

export interface CarEngine {
  id: string
  model_id: string
  displacement: string
  fuel_type: string
}

// ─── Cart ──────────────────────────────────────────────────────────
export interface CartItem {
  id: string
  product: ProductCard
  quantity: number
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: ProductCard, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

// ─── Order ─────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  user_id: string | null
  status: OrderStatus
  total: number
  shipping_info: ShippingInfo
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  qty: number
  unit_price: number
  product?: ProductCard
}

// ─── Checkout ──────────────────────────────────────────────────────
export interface ShippingInfo {
  first_name: string
  last_name: string
  email: string
  phone: string
  city: string
  address: string
  delivery_method: 'nova_poshta' | 'ukr_poshta' | 'pickup'
  payment_method: 'cash_on_delivery' | 'card_on_delivery' | 'online'
  notes?: string
}

// ─── Profile / Auth ────────────────────────────────────────────────
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  phone: string | null
  delivery_address: string | null
  created_at: string
}

// ─── Search ────────────────────────────────────────────────────────
export interface SearchResult {
  id: string
  slug: string
  name_ua: string
  price: number
  sale_price: number | null
  images: string[]
  category_name?: string
}

// ─── VIN ───────────────────────────────────────────────────────────
export interface VINResult {
  vin: string
  make: string
  model: string
  year: number
  engine: string
  body_type: string
  compatible_products?: ProductCard[]
}

// ─── AI Assistant ──────────────────────────────────────────────────
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Analytics ────────────────────────────────────────────────────
export interface AnalyticsData {
  total_revenue: number
  total_orders: number
  total_products: number
  total_users: number
  recent_orders: Order[]
  top_products: (ProductCard & { total_sold: number })[]
}
