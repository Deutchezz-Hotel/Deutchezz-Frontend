import { useRef, useState } from 'react';
import { services } from '@/api';
import { toApiError } from '@/api/problem';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImagePlus, Loader2, X } from 'lucide-react';

const MAX_IMAGES = 8;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUploader({ value, onChange, max = MAX_IMAGES }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFiles = async (files: File[]) => {
    const room = max - value.length;
    if (room <= 0) {
      toast.error(`You can add up to ${max} images`);
      return;
    }
    const accepted: File[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10MB`);
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of accepted) {
        const result = await services.admin.uploadImage(file);
        uploaded.push(result.url);
      }
      onChange([...value, ...uploaded]);
      toast.success(uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`);
    } catch (error) {
      toast.error(toApiError(error).userMessage);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const pick = () => {
    if (!uploading) inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Add room type images"
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pick();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
          dragging ? 'border-forest-500 bg-forest-50' : 'border-ink-300 hover:border-forest-400 hover:bg-ink-50',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> : <ImagePlus className="h-5 w-5 text-ink-500" />}
        <p className="text-sm font-medium text-ink-700">{uploading ? 'Uploading…' : 'Drag & drop photos here'}</p>
        <p className="text-xs text-ink-500">or click to browse · JPEG, PNG, WEBP · up to 10MB each · max {max}</p>
      </div>

      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative aspect-video overflow-hidden rounded-lg border border-ink-200">
              <img src={url} alt={`Room type image ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void uploadFiles(Array.from(e.target.files));
        }}
      />
    </div>
  );
}
