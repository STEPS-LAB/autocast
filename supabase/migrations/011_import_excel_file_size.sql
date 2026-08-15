-- Allow dealer Excel workbooks (often 20–50 MB with embedded photos) in product-images.
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'product-images';
