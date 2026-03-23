import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, selectCartTotal, selectCartCount } from '@/lib/store/cart'
import type { ProductCard } from '@/types'

const mockProduct: ProductCard = {
  id: 'test-product-1',
  slug: 'test-product',
  name_ua: 'Тестовий товар',
  price: 1000,
  sale_price: null,
  images: ['https://example.com/image.jpg'],
  stock: 10,
  category: { name_ua: 'Тест', slug: 'test' },
  brand: { name: 'TestBrand' },
}

const mockProduct2: ProductCard = {
  id: 'test-product-2',
  slug: 'test-product-2',
  name_ua: 'Тестовий товар 2',
  price: 2000,
  sale_price: 1500,
  images: [],
  stock: 5,
}

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false })
  })

  describe('addItem', () => {
    it('adds a new item to the cart', () => {
      useCartStore.getState().addItem(mockProduct)
      const { items } = useCartStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0]?.product.id).toBe('test-product-1')
      expect(items[0]?.quantity).toBe(1)
    })

    it('adds item with custom quantity', () => {
      useCartStore.getState().addItem(mockProduct, 3)
      const { items } = useCartStore.getState()
      expect(items[0]?.quantity).toBe(3)
    })

    it('increases quantity if product already in cart', () => {
      useCartStore.getState().addItem(mockProduct)
      useCartStore.getState().addItem(mockProduct)
      const { items } = useCartStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0]?.quantity).toBe(2)
    })

    it('opens cart drawer when item is added', () => {
      useCartStore.getState().addItem(mockProduct)
      expect(useCartStore.getState().isOpen).toBe(true)
    })

    it('adds multiple different products', () => {
      useCartStore.getState().addItem(mockProduct)
      useCartStore.getState().addItem(mockProduct2)
      expect(useCartStore.getState().items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('removes an item by cart item id', () => {
      useCartStore.getState().addItem(mockProduct)
      const { items } = useCartStore.getState()
      useCartStore.getState().removeItem(items[0]!.id)
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('does not affect other items when removing', () => {
      useCartStore.getState().addItem(mockProduct)
      useCartStore.getState().addItem(mockProduct2)
      const { items } = useCartStore.getState()
      useCartStore.getState().removeItem(items[0]!.id)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]?.product.id).toBe('test-product-2')
    })
  })

  describe('updateQuantity', () => {
    it('updates quantity correctly', () => {
      useCartStore.getState().addItem(mockProduct)
      const { items } = useCartStore.getState()
      useCartStore.getState().updateQuantity(items[0]!.id, 5)
      expect(useCartStore.getState().items[0]?.quantity).toBe(5)
    })

    it('removes item when quantity is set to 0', () => {
      useCartStore.getState().addItem(mockProduct)
      const { items } = useCartStore.getState()
      useCartStore.getState().updateQuantity(items[0]!.id, 0)
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('removes item when quantity is negative', () => {
      useCartStore.getState().addItem(mockProduct)
      const { items } = useCartStore.getState()
      useCartStore.getState().updateQuantity(items[0]!.id, -1)
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('removes all items', () => {
      useCartStore.getState().addItem(mockProduct)
      useCartStore.getState().addItem(mockProduct2)
      useCartStore.getState().clearCart()
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('total calculation', () => {
    it('calculates total correctly', () => {
      useCartStore.getState().addItem(mockProduct, 2)
      expect(selectCartTotal(useCartStore.getState())).toBe(2000)
    })

    it('uses sale_price when available', () => {
      useCartStore.getState().addItem(mockProduct2, 1)
      expect(selectCartTotal(useCartStore.getState())).toBe(1500)
    })

    it('calculates total for multiple items', () => {
      useCartStore.getState().addItem(mockProduct, 2)
      useCartStore.getState().addItem(mockProduct2, 1)
      expect(selectCartTotal(useCartStore.getState())).toBe(3500)
    })

    it('returns 0 for empty cart', () => {
      expect(selectCartTotal(useCartStore.getState())).toBe(0)
    })
  })

  describe('count', () => {
    it('returns total item count', () => {
      useCartStore.getState().addItem(mockProduct, 2)
      useCartStore.getState().addItem(mockProduct2, 3)
      expect(selectCartCount(useCartStore.getState())).toBe(5)
    })

    it('returns 0 for empty cart', () => {
      expect(selectCartCount(useCartStore.getState())).toBe(0)
    })
  })

  describe('cart drawer state', () => {
    it('opens cart', () => {
      useCartStore.getState().openCart()
      expect(useCartStore.getState().isOpen).toBe(true)
    })

    it('closes cart', () => {
      useCartStore.getState().openCart()
      useCartStore.getState().closeCart()
      expect(useCartStore.getState().isOpen).toBe(false)
    })
  })
})
