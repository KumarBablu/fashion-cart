import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(10, "Mobile number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]{10,16}$/, "Enter a valid 10-digit mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or mobile number").optional(),
  email: z.string().trim().optional(),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72, "Password is too long")
    .optional()
    .or(z.literal("")),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobileNumber: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid mobile number"),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pinCode: z.string().trim().regex(/^[0-9]{4,10}$/, "Enter a valid PIN code"),
  landmark: z.string().trim().max(150).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Please select a delivery address"),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["MANUAL_UPI", "COD", "ONLINE_GATEWAY"]).default("MANUAL_UPI"),
  customerNotes: z.string().max(500).optional(),
});

export const utrSubmissionSchema = z.object({
  utrNumber: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const productSchema = z.object({
  productId: z.string().optional().nullable().or(z.literal("")),
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1),
  department: z.string().optional().nullable().or(z.literal("")),
  subcategory: z.string().optional().nullable().or(z.literal("")),
  categoryPath: z.string().optional().nullable().or(z.literal("")),
  productType: z.string().optional().nullable().or(z.literal("")),
  productUrl: z.string().optional().nullable().or(z.literal("")),
  brand: z.string().optional().or(z.literal("")),
  fabric: z.string().optional().or(z.literal("")),
  material: z.string().optional().nullable().or(z.literal("")),
  pattern: z.string().optional().nullable().or(z.literal("")),
  fit: z.string().optional().nullable().or(z.literal("")),
  occasion: z.string().optional().nullable().or(z.literal("")),
  currency: z.string().default("INR").optional(),
  availability: z.string().default("IN_STOCK").optional(),
  sellerId: z.string().optional().nullable().or(z.literal("")),
  sellerName: z.string().optional().nullable().or(z.literal("")),
  sellerIdentifier: z.string().optional().nullable().or(z.literal("")),
  sellerUrl: z.string().optional().nullable().or(z.literal("")),
  sellerPhone: z.string().optional().nullable().or(z.literal("")),
  sellerEmail: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["ACTIVE", "ARCHIVED", "DRAFT"]).default("ACTIVE"),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  tags: z.string().optional().or(z.literal("")),
});

export const sellerSchema = z.object({
  sellerId: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(120),
  phone: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  url: z.string().url().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const variantSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  colour: z.string().trim().min(1).max(60),
  size: z.string().trim().min(1).max(30),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  stockQuantity: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
