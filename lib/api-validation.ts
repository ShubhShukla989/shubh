import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodIssue } from 'zod';

/**
 * Validate request body against a Zod schema
 */
export function validateRequest<T extends z.ZodType<any, any>>(
  schema: T,
  handler: (data: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return handler(validatedData, request);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: error.issues.map((err: ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          },
          { status: 400 }
        );
      }
      
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodType<any, any>>(
  schema: T,
  handler: (data: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      
      // Convert string values to appropriate types for common cases
      const processedParams = Object.entries(queryParams).reduce((acc, [key, value]) => {
        // Try to convert to number if it looks like a number
        if (/^\d+$/.test(value)) {
          acc[key] = parseInt(value, 10);
        } else if (/^\d*\.\d+$/.test(value)) {
          acc[key] = parseFloat(value);
        } else if (value === 'true' || value === 'false') {
          acc[key] = value === 'true';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      const validatedData = schema.parse(processedParams);
      return handler(validatedData, request);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid query parameters',
            details: error.issues.map((err: ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}

/**
 * Validate both body and query parameters
 */
export function validateRequestAndQuery<
  TBody extends z.ZodType<any, any>,
  TQuery extends z.ZodType<any, any>
>(
  bodySchema: TBody,
  querySchema: TQuery,
  handler: (
    bodyData: z.infer<TBody>,
    queryData: z.infer<TQuery>,
    request: NextRequest
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Validate body
      const body = await request.json();
      const validatedBody = bodySchema.parse(body);
      
      // Validate query
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = querySchema.parse(queryParams);
      
      return handler(validatedBody, validatedQuery, request);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: error.issues.map((err: ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}