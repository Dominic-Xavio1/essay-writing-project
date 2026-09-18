import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { updateUser, formatUser } from '@/lib/services/users';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  try {
    const formData = await req.formData();
    const file = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return err('No avatar file provided');
    }

    // 1. File Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return err('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      return err('File is too large. Maximum file size is 5MB.');
    }

    // 2. Storage Handling
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let avatarUrl = '';
    try {
      const ext = file.type.split('/')[1] || 'jpg';
      const filename = `avatar-${userId}-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      avatarUrl = `/uploads/avatars/${filename}`;
    } catch (fsErr) {
      console.warn('Filesystem write failed, falling back to Data URL:', fsErr);
      const base64 = buffer.toString('base64');
      avatarUrl = `data:${file.type};base64,${base64}`;
    }

    // 3. Update User Record
    await updateUser(userId, { avatar: avatarUrl });
    const updatedProfile = await formatUser(userId);

    return ok({ user: updatedProfile, avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return err(error instanceof Error ? error.message : 'Avatar upload failed', 500);
  }
}
