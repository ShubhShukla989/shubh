import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Custom hook for form validation using Zod schemas
 */
export function useFormValidation<TSchema extends z.ZodType<any, any>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>
) {
  type FormData = z.infer<TSchema>;
  
  return useForm<FormData>({
    resolver: zodResolver(schema) as any,
    mode: 'onChange',
    ...options,
  });
}

/**
 * Utility to get field error message
 */
export function getFieldError(errors: FieldValues, fieldName: string): string | undefined {
  const error = errors[fieldName];
  return error?.message;
}

/**
 * Utility to check if field has error
 */
export function hasFieldError(errors: FieldValues, fieldName: string): boolean {
  return !!errors[fieldName];
}