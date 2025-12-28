import { z } from 'zod';
import { requiredString, optionalString, emailSchema, passwordSchema, booleanWithDefault, positiveNumber } from './base';

export const userSchema = z.object({
  name: requiredString('Name is required'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
  is_active: booleanWithDefault(true),
  avatar_url: optionalString,
  bio: optionalString,
});

export const userUpdateSchema = userSchema.partial().extend({
  id: positiveNumber,
}).omit({ password: true });

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
  token: requiredString('Reset token is required'),
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Type exports
export type UserFormData = z.infer<typeof userSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type UserLoginData = z.infer<typeof userLoginSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;