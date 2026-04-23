import { z } from "zod";

/**
 * User validation schemas
 */
export const createUserSchema = z.object({
  fullname: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format").max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
  mobile: z.string().optional(),
  role: z.enum(["Super Admin", "Admin", "Editor"]),
});

export const updateUserSchema = z.object({
  fullname: z.string().min(2).max(100).optional(),
  mobile: z.string().optional(),
  role: z.enum(["Super Admin", "Admin", "Editor"]).optional(),
  status: z.enum(["Active", "Inactive", "Banned"]).optional(),
});

/**
 * Category validation schemas
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  alias: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Alias must be lowercase alphanumeric with hyphens"),
  status: z.enum(["active", "inactive"]).default("active"),
  parent_id: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  alias: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  parent_id: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

/**
 * Edition validation schemas
 */
export const createEditionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  category_id: z.number().int().positive("Category is required"),
  edition_date: z.string().datetime("Invalid date format"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  pdf_url: z.string().url().optional().nullable(),
});

export const updateEditionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category_id: z.number().int().positive().optional(),
  edition_date: z.string().datetime().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  pdf_url: z.string().url().optional().nullable(),
});

/**
 * Media validation schemas
 */
export const uploadMediaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  alt_text: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Page validation schemas
 */
export const createPageSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  alias: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid ID"),
});

/**
 * Authentication schemas
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(12, "New password must be at least 12 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
  newPassword: z.string().min(12, "Password must be at least 12 characters"),
});
