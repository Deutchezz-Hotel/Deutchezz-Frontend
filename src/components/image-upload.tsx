import { useCallback, useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { toApiError } from '@/api/problem';
import { services } from '@/api';
import { Loader2, UploadCloud, X } from 'lucide-react';

const DEFAULT_MAX = 8;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/**
 * Drag-and-drop / click-to-browse image uploader.
 *
 * Files are pushed straight to Cloudinary through the admin upload endpoint
 * (POST /uploads/images) and only the returned secure URL is stored on the form,
 * exactly like the URL list it replaces.
 */
export function ImageUpload({ value, onChange, max = DEFAULT_MAX }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const atCapacity = value.length >= max;

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      const slots = max - value.length;
      if (slots <= 0) {
        toast.error(`You can add up to ${max} images`);
        return;
      }

      const accepted: File[] = [];
      for (const file of incoming) {
        if (!ALLOWED.has(file.type.toLowerCase())) {
          toast.error(`${file.name} is not a supported image (JPEG, PNG, WEBP, HEIC)`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is larger than the 10MB limit`);
          continue;
        }
        accepted.push(file);
      }

      const batch = accepted.slice(0, slots);
      if (accepted.length > slots) toast.error(`You can add up to ${max} images`);
      if (batch.length === 0) return;

      setUploading(true);
      try {
        const added: string[] = [];
        for (const file of batch) {
          const result = await services.uploads.uploadImage(file);
          if (!value.includes(result.url) && !added.includes(result.url)) added.push(result.url);
        }
        if (added.length > 0) {
          onChange([...value, ...added]);
          toast.success(added.length > 1 ? `${added.length} images added` : 'Image added');
        }
      } catch (error) {
        toast.error(toApiError(error).userMessage);
      } finally {
        setUploading(false);
      }
    },
    [max, onChange, value],
  );

  const openPicker = () => {
    if (!uploading && !atCapacity) inputRef.current?.click();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;
    if (e.dataTransfer?.files?.length) void uploadFiles(e.dataTransfer.files);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const disabled = uploading || atCapacity;

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload room images"
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          dragActive && 'border-primary bg-accent',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="h-5 w-5 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-muted-foreground">
          {uploading ? 'Uploading…' : dragActive ? 'Drop to upload' : 'Drag & drop images here'}
        </p>
        <p className="text-xs text-muted-foreground">
          or click to choose from your device · JPEG, PNG, WEBP, HEIC · up to 10MB · {value.length}/{max}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-video overflow-hidden rounded-lg border border-ink-200"
            >
              <img
                src={url}
                alt={`Room type image ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.25';
                }}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-overlay/60 p-1 text-on-media opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
