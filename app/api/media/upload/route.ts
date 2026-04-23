import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media_files } from '@/lib/schema/media';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Resolve upload directory — use absolute UPLOAD_DIR env var in production
// to avoid process.cwd() pointing to .next/standalone/ instead of project root
function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return resolve(process.env.UPLOAD_DIR);
  }
  // Fallback: walk up from __dirname to find the project root's public/uploads
  // In standalone mode __dirname is .next/standalone/app/api/media/upload/
  // We need to go up enough levels to reach the actual public/ folder
  return join(process.cwd(), 'public', 'uploads');
}

// POST /api/media/upload - Upload media files
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload API called');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log('📁 Files received:', files.length);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.size} bytes, ${file.type})`);
    });
    
    if (!files || files.length === 0) {
      console.log('❌ No files provided');
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = getUploadDir();
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    console.log(`📂 Upload directory: ${uploadDir}`);

    const uploadedFiles = [];

    for (const file of files) {
      if (file.size === 0) continue;

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(uploadDir, filename);
      const fileUrl = `/uploads/${filename}`;

      // Write file to disk
      console.log(`💾 Writing file to: ${filePath}`);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log(`✅ File written successfully: ${filename}`);

      // Save to database
      console.log(`💽 Saving to database: ${filename}`);
      const [insertedFile] = await db.insert(media_files).values({
        filename,
        original_name: file.name,
        file_path: filePath,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        title: file.name.split('.')[0], // Use filename without extension as title
      }).returning();
      console.log(`✅ Database record created with ID: ${insertedFile.id}`);

      uploadedFiles.push({
        id: insertedFile.id.toString(),
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: insertedFile.created_at
      });
    }

    console.log(`🎉 Upload completed successfully: ${uploadedFiles.length} files`);
    return NextResponse.json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('❌ Error uploading files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}