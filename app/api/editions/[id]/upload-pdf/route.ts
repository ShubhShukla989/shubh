import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, epaper_categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateWidgetCachesAsync } from '@/lib/cache/universal';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `edition-${editionId}-${Date.now()}.pdf`;
    const filePath = `editions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    const [updatedEdition] = await db
      .update(editions)
      .set({ pdf_url: publicUrl })
      .where(eq(editions.id, editionId))
      .returning();

    invalidateWidgetCachesAsync();

    if (updatedEdition?.status === 'published') {
      try {
        revalidatePath('/', 'page');
        revalidatePath('/epaper/display', 'page');

        if (updatedEdition.category_id) {
          const [cat] = await db
            .select({ alias: epaper_categories.alias })
            .from(epaper_categories)
            .where(eq(epaper_categories.id, updatedEdition.category_id))
            .limit(1);

          if (cat?.alias) {
            revalidatePath(`/epaper/category/${cat.alias}`, 'page');
          }
        }

        revalidatePath(`/epaper/view/${editionId}`, 'page');
      } catch (e) {
        console.error('Failed to clear cache:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: { pdf_url: publicUrl, file_name: file.name },
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload PDF' }, { status: 500 });
  }
}
