import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');
const imagesToOptimize = [
    'developer.png',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'screenshot-desktop.png',
    'screenshot-mobile.png'
];

async function optimizeImages() {
    console.log('🖼️  Starting image optimization...\n');

    for (const imageName of imagesToOptimize) {
        const inputPath = path.join(publicDir, imageName);
        const outputPath = path.join(publicDir, imageName);

        if (!fs.existsSync(inputPath)) {
            console.log(`⚠️  Skipping ${imageName} - file not found`);
            continue;
        }

        const originalSize = fs.statSync(inputPath).size;

        try {
            // Create a backup
            const backupPath = path.join(publicDir, `${imageName}.backup`);
            if (!fs.existsSync(backupPath)) {
                fs.copyFileSync(inputPath, backupPath);
            }

            // Optimize the image
            await sharp(inputPath)
                .png({
                    quality: 80,
                    compressionLevel: 9,
                    adaptiveFiltering: true,
                    palette: true
                })
                .toFile(outputPath + '.tmp');

            // Replace original with optimized
            fs.renameSync(outputPath + '.tmp', outputPath);

            const newSize = fs.statSync(outputPath).size;
            const savings = ((originalSize - newSize) / originalSize * 100).toFixed(2);

            console.log(`✅ ${imageName}`);
            console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
            console.log(`   Optimized: ${(newSize / 1024).toFixed(2)} KB`);
            console.log(`   Saved: ${savings}%\n`);
        } catch (error) {
            console.error(`❌ Error optimizing ${imageName}:`, error.message);
        }
    }

    console.log('✨ Image optimization complete!');
}

optimizeImages().catch(console.error);
