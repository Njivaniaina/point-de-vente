import { json } from '@sveltejs/kit';
import { readdirSync, existsSync, statSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const uploadsDir = join(process.cwd(), 'static', 'uploads');
        
        if (!existsSync(uploadsDir)) {
            return json({ images: [] });
        }

        const files = readdirSync(uploadsDir);
        
        // Filter for common image extensions and sort by modification time (newest first)
        const images = files
            .filter(file => {
                const ext = file.toLowerCase().split('.').pop();
                return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
            })
            .map(file => {
                const filePath = join(uploadsDir, file);
                const stats = statSync(filePath);
                return {
                    url: `/uploads/${file}`,
                    name: file,
                    mtime: stats.mtime.getTime()
                };
            })
            .sort((a, b) => b.mtime - a.mtime)
            .map(img => img.url);

        return json({ images });
    } catch (err: any) {
        console.error('API Images Error:', err);
        return json({ error: 'Failed to read images directory' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request }) => {
    try {
        const { url } = await request.json();
        if (!url || !url.startsWith('/uploads/')) {
            return json({ error: 'Invalid URL' }, { status: 400 });
        }

        const filename = url.replace('/uploads/', '');
        const uploadsDir = resolve(process.cwd(), 'static', 'uploads');
        const filePath = resolve(uploadsDir, filename);

        // Security check to prevent directory traversal
        if (!filePath.startsWith(uploadsDir)) {
            return json({ error: 'Invalid file path' }, { status: 400 });
        }

        if (existsSync(filePath)) {
            unlinkSync(filePath);
            
            // Update any products using this image back to the default
            try {
                db.prepare(`
                    UPDATE products 
                    SET image_url = '/default-product.png' 
                    WHERE image_url = ?
                `).run(url);
            } catch (dbErr) {
                console.error("Erreur mise à jour des produits après suppression d'image:", dbErr);
                // We still consider the deletion successful even if DB update fails,
                // but we log it. It shouldn't stop the client from knowing the file is gone.
            }

            return json({ success: true, message: "Image supprimée et produits mis à jour" });
        } else {
            return json({ error: 'File not found' }, { status: 404 });
        }
    } catch (err) {
        console.error('API Image Delete Error:', err);
        return json({ error: 'Failed to delete image' }, { status: 500 });
    }
};
