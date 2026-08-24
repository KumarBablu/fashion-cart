-- ============================================================================
-- Fashion Cart: High-Performance Database Indexes for Supabase PostgreSQL
-- Run this in your Supabase SQL Editor for both:
-- 1. Garments Database (Default DATABASE_URL)
-- 2. Jewellery Database (JEWELLERY_DATABASE_URL)
-- ============================================================================

-- 1. Category Indexes (Hierarchy & Active filter)
CREATE INDEX IF NOT EXISTS "Category_isActive_parentId_sortOrder_idx" 
  ON "Category" ("isActive", "parentId", "sortOrder");

CREATE INDEX IF NOT EXISTS "Category_slug_isActive_idx" 
  ON "Category" ("slug", "isActive");

-- 2. Product Indexes (Sorting, Status, Featured, New Arrival, Best Seller)
CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx" 
  ON "Product" ("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Product_categoryId_status_idx" 
  ON "Product" ("categoryId", "status");

CREATE INDEX IF NOT EXISTS "Product_status_isFeatured_idx" 
  ON "Product" ("status", "isFeatured");

CREATE INDEX IF NOT EXISTS "Product_status_isNewArrival_idx" 
  ON "Product" ("status", "isNewArrival");

CREATE INDEX IF NOT EXISTS "Product_status_isBestSeller_idx" 
  ON "Product" ("status", "isBestSeller");

-- 3. Product Variant Indexes (Price filtering, Product Variants, Stock)
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_isActive_idx" 
  ON "ProductVariant" ("productId", "isActive");

CREATE INDEX IF NOT EXISTS "ProductVariant_isActive_price_idx" 
  ON "ProductVariant" ("isActive", "price");

-- 4. Product Image Indexes (Sort order within product)
CREATE INDEX IF NOT EXISTS "ProductImage_productId_sortOrder_idx" 
  ON "ProductImage" ("productId", "sortOrder");

-- 5. Cart & Wishlist Item Indexes (Fast customer lookups)
CREATE INDEX IF NOT EXISTS "CartItem_cartId_idx" 
  ON "CartItem" ("cartId");

CREATE INDEX IF NOT EXISTS "WishlistItem_wishlistId_idx" 
  ON "WishlistItem" ("wishlistId");

-- 6. Review Indexes (Product reviews sorted by date)
CREATE INDEX IF NOT EXISTS "Review_productId_status_createdAt_idx" 
  ON "Review" ("productId", "status", "createdAt" DESC);

-- 7. Banner & Promotion Indexes (Active banners ordered by sortOrder)
CREATE INDEX IF NOT EXISTS "Banner_isActive_position_sortOrder_idx" 
  ON "Banner" ("isActive", "position", "sortOrder");

CREATE INDEX IF NOT EXISTS "Promotion_isActive_placement_sortOrder_idx" 
  ON "Promotion" ("isActive", "placement", "sortOrder");

-- 8. Order Indexes (Customer order history sorted by date)
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" 
  ON "Order" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" 
  ON "Order" ("status", "createdAt" DESC);
