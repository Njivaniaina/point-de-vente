import { json } from '@sveltejs/kit';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file || !file.name) {
      return json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'static', 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.name.split('.').pop();
    const filename = `img-${uniqueSuffix}.${ext}`;
    const filePath = join(uploadsDir, filename);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(filePath, buffer);

    // Return the public URL
    return json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    console.error('Erreur lors de l\'upload:', err);
    return json({ error: 'Erreur serveur lors de l\'upload du fichier.' }, { status: 500 });
  }
};
