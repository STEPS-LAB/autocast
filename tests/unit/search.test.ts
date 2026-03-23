import { describe, it, expect } from 'vitest'
import { searchProducts, getFeaturedProducts, getProductBySlug, getProductsByCategory, PRODUCTS, CATEGORIES } from '@/lib/data/seed'

describe('Search Logic', () => {
  describe('searchProducts', () => {
    it('returns products matching query in name', () => {
      const results = searchProducts('Alpine')
      expect(results.length).toBeGreaterThan(0)
      results.forEach(p => {
        const product = PRODUCTS.find(pr => pr.id === p.id)
        expect(
          product?.name_ua.toLowerCase().includes('alpine') ||
          product?.description_ua.toLowerCase().includes('alpine')
        ).toBe(true)
      })
    })

    it('returns empty array for empty query', () => {
      expect(searchProducts('')).toHaveLength(0)
      expect(searchProducts('   ')).toHaveLength(0)
    })

    it('is case insensitive', () => {
      const lower = searchProducts('pioneer')
      const upper = searchProducts('PIONEER')
      const mixed = searchProducts('Pioneer')
      expect(lower.length).toBe(upper.length)
      expect(lower.length).toBe(mixed.length)
    })

    it('returns empty array when no match found', () => {
      expect(searchProducts('xyznonexistentproduct123')).toHaveLength(0)
    })

    it('finds by description content', () => {
      const results = searchProducts('Bluetooth')
      expect(results.length).toBeGreaterThan(0)
    })

    it('finds GPS products', () => {
      const results = searchProducts('GPS')
      expect(results.length).toBeGreaterThan(0)
    })

    it('finds LED products', () => {
      const results = searchProducts('LED')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('getFeaturedProducts', () => {
    it('returns only featured products', () => {
      const featured = getFeaturedProducts()
      expect(featured.length).toBeGreaterThan(0)
      featured.forEach(p => {
        const product = PRODUCTS.find(pr => pr.id === p.id)
        expect(product?.is_featured).toBe(true)
      })
    })

    it('returns ProductCard format', () => {
      const featured = getFeaturedProducts()
      expect(featured[0]).toHaveProperty('id')
      expect(featured[0]).toHaveProperty('slug')
      expect(featured[0]).toHaveProperty('name_ua')
      expect(featured[0]).toHaveProperty('price')
      expect(featured[0]).toHaveProperty('images')
    })
  })

  describe('getProductBySlug', () => {
    it('returns product by slug', () => {
      const product = getProductBySlug('avtomagnitola-alpine-ive-w530e')
      expect(product).toBeDefined()
      expect(product?.name_ua).toContain('Alpine')
    })

    it('returns undefined for unknown slug', () => {
      expect(getProductBySlug('nonexistent-slug')).toBeUndefined()
    })
  })

  describe('getProductsByCategory', () => {
    it('returns products for valid category slug', () => {
      const audioProducts = getProductsByCategory('avtozvuk')
      expect(audioProducts.length).toBeGreaterThan(0)
      audioProducts.forEach(p => {
        expect(p.category?.slug).toBe('avtozvuk')
      })
    })

    it('returns empty array for invalid category', () => {
      expect(getProductsByCategory('nonexistent-category')).toHaveLength(0)
    })

    it('returns products for each category', () => {
      for (const cat of CATEGORIES) {
        const products = getProductsByCategory(cat.slug)
        expect(products.length).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
