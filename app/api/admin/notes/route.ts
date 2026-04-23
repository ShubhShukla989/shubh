import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { admin_notes, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { isSuperAdmin } from '@/lib/permissions';

// GET - Fetch admin notes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all notes with creator info in a single query using join
    const notesWithCreator = await db
      .select({
        id: admin_notes.id,
        content: admin_notes.content,
        created_at: admin_notes.created_at,
        updated_at: admin_notes.updated_at,
        created_by_name: users.fullname,
        created_by_email: users.email,
      })
      .from(admin_notes)
      .leftJoin(users, eq(admin_notes.created_by, users.id))
      .orderBy(desc(admin_notes.updated_at));

    return NextResponse.json({ success: true, notes: notesWithCreator });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST - Create or update note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is superadmin
    const isSuperAdminUser = await isSuperAdmin(user.id);
    
    if (!isSuperAdminUser) {
      return NextResponse.json({ error: 'Only Super Admin can create/edit notes' }, { status: 403 });
    }

    const body = await request.json();
    const { content, noteId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (noteId) {
      // Update existing note
      await db
        .update(admin_notes)
        .set({
          content: content.trim(),
          updated_by: user.id,
          updated_at: Date.now(),
        })
        .where(eq(admin_notes.id, noteId));

      return NextResponse.json({ success: true, message: 'Note updated successfully' });
    } else {
      // Create new note
      await db.insert(admin_notes).values({
        content: content.trim(),
        created_by: user.id,
        updated_by: user.id,
      });

      return NextResponse.json({ success: true, message: 'Note created successfully' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

// DELETE - Delete note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is superadmin
    const isSuperAdminUser = await isSuperAdmin(user.id);
    
    if (!isSuperAdminUser) {
      return NextResponse.json({ error: 'Only Super Admin can delete notes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    await db.delete(admin_notes).where(eq(admin_notes.id, parseInt(noteId)));

    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
