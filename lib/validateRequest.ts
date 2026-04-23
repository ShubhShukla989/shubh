import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";

/**
 * Validate request body against Zod schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error", {
        errors: error.issues,
        path: new URL(request.url).pathname,
      });
      
      return {
        data: null,
        error: NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    if (error instanceof SyntaxError) {
      return {
        data: null,
        error: NextResponse.json(
          { success: false, error: "Invalid JSON" },
          { status: 400 }
        ),
      };
    }
    
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            success: false,
            error: "Invalid query parameters",
            details: error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate route parameters (e.g., [id])
 */
export function validateParams<T>(
  params: any,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const data = schema.parse(params);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            success: false,
            error: "Invalid parameters",
            details: error.issues,
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      ),
    };
  }
}
