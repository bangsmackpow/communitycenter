import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImageToWebP } from '../utils/imageCompressor';

export interface UploadedMediaItem {
  id: string;
  file?: File;
  previewUrl: string;
  r2Key?: string;
  url?: string;
  originalSize: number;
  compressedSize: number;
}

interface ImageUploaderProps {
  mediaList: UploadedMediaItem[];
  onChange: (items: UploadedMediaItem[]) => void;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  mediaList,
  onChange,
  maxFiles = 6,
}) => {
  const [compressing, setCompressing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setUploadStatus('Compressing images to WebP...');
    const newItems: UploadedMediaItem[] = [...mediaList];

    for (let i = 0; i < files.length; i++) {
      if (newItems.length >= maxFiles) break;
      const file = files[i];

      try {
        const compressed = await compressImageToWebP(file, 1200, 0.85);
        let r2Key: string | undefined;
        let remoteUrl: string | undefined;

        // Upload directly to Cloudflare R2 via Edge API
        setUploadStatus(`Uploading ${file.name} to Cloudflare R2...`);
        try {
          const formData = new FormData();
          formData.append('file', compressed.file, `${file.name.replace(/\.[^/.]+$/, '')}.webp`);
          const uploadRes = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = (await uploadRes.json()) as any;
            if (uploadData.url) {
              remoteUrl = uploadData.url;
              r2Key = uploadData.r2Key;
            }
          }
        } catch (uploadErr) {
          console.warn('R2 upload skipped or failed, using local fallback:', uploadErr);
        }

        newItems.push({
          id: crypto.randomUUID(),
          file: compressed.file,
          previewUrl: remoteUrl || compressed.previewUrl,
          url: remoteUrl || compressed.previewUrl,
          r2Key: r2Key,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        });
      } catch (err) {
        console.error('Processing failed for', file.name, err);
      }
    }

    onChange(newItems);
    setCompressing(false);
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    onChange(mediaList.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-300">Listing Photos</span>
        <span>
          {mediaList.length}/{maxFiles} uploaded • WebP auto-compressed under 1200px
        </span>
      </div>

      {/* Grid of uploaded images + upload button */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {mediaList.map((m, index) => {
          const savings = Math.max(
            0,
            Math.round(((m.originalSize - m.compressedSize) / m.originalSize) * 100)
          );
          return (
            <div
              key={m.id}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800 group"
            >
              <img
                src={m.previewUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-prairie-700/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              {savings > 0 && (
                <span className="absolute top-1 left-1 bg-slate-900/80 text-prairie-300 text-[9px] px-1 py-0.5 rounded backdrop-blur">
                  -{savings}%
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-1 opacity-90 hover:opacity-100 hover:bg-rose-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Upload Trigger Tile */}
        {mediaList.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-prairie-500 bg-slate-800/50 hover:bg-slate-800 flex flex-col items-center justify-center p-2 text-center transition-colors min-h-[44px]"
          >
            {compressing ? (
              <>
                <Loader2 className="w-5 h-5 text-prairie-400 animate-spin" />
                <span className="text-[10px] text-slate-400 mt-1">Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-prairie-400" />
                <span className="text-[11px] font-medium text-slate-300 mt-1">Add Photo</span>
                <span className="text-[9px] text-slate-500">Camera / Files</span>
              </>
            )}
          </button>
        )}
      </div>

      {uploadStatus && (
        <div className="flex items-center gap-2 text-xs font-semibold text-prairie-600 dark:text-prairie-400 bg-prairie-50 dark:bg-prairie-950/40 p-2.5 rounded-xl border border-prairie-200 dark:border-prairie-800">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{uploadStatus}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
};
