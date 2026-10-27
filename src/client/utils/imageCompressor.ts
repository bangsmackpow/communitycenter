/**
 * Compresses an image to WebP with a maximum dimension of 1200px
 * using HTML5 Canvas before uploading to Cloudflare R2.
 */
export async function compressImageToWebP(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.85
): Promise<{
  blob: Blob;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        return reject(new Error('Failed to read image file'));
      }
      img.src = e.target.result as string;
    };

    reader.onerror = () => reject(new Error('FileReader error'));

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Downscale if either dimension exceeds maxDimension (1200px)
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas 2d context'));
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas toBlob conversion failed'));
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(blob);

          resolve({
            blob,
            file: compressedFile,
            previewUrl,
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image in canvas'));

    reader.readAsDataURL(file);
  });
}
