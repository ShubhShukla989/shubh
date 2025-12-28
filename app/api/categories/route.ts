import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { desc } from 'drizzle-orm';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const allCategories = await db.select().from(categories).orderBy(desc(categories.created_at));
    
    return NextResponse.json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, alias, status = 'active', parent_id = null, sort_order = 0 } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    const [newCategory] = await db.insert(categories).values({
      name,
      alias: alias || name.toLowerCase().replace(/\s+/g, '-'),
      status,
      parent_id,
      sort_order,
      created_at: new Date().toISOString()
    }).returning();
    
    return NextResponse.json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}