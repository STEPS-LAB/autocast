/**
 * YML: `<price>` = актуальна ціна продажу, `<price_old>` = стара/повна ціна.
 * БД: `price` = ціна без знижки (list), `sale_price` = ціна зі знижкою (має бути < price).
 */
export function dbPricingFromYmlOffer(product: {
  price: number
  oldPrice: number | null
}): { price: number; sale_price: number | null } {
  const { price, oldPrice } = product
  if (
    oldPrice != null &&
    Number.isFinite(oldPrice) &&
    Number.isFinite(price) &&
    oldPrice > price &&
    price > 0
  ) {
    return { price: oldPrice, sale_price: price }
  }
  return { price, sale_price: null }
}
