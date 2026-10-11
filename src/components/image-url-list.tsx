import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImagePlus, Plus, X } from 'lucide-react';

const DEFAULT_MAX = 8;

interface ImageUrlListProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ImageUrlList({ value, onChange, max = DEFAULT_MAX }: ImageUrlListProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const url = draft.trim();
    if (!url) return;
    if (!isHttpUrl(url)) {
      toast.error('Enter a valid image URL starting with http:// or https://');
      return;
    }
    if (value.includes(url)) {
      toast.error('That image URL has already been added');
      return;
    }
    if (value.length >= max) {
      toast.error(`You can add up to ${max} images`);
      return;
    }
    onChange([...value, url]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="https://example.com/room.jpg"
          aria-label="Image URL"
        />
        <Button type="button" variant="outline" onClick={add} disabled={value.length >= max}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center">
          <ImagePlus className="h-5 w-5 text-ink-500" />
          <p className="text-sm text-ink-600">No images yet</p>
          <p className="text-xs text-ink-500">Paste image URLs above · up to {max}</p>
        </div>
      ) : (
        <div className={cn('grid grid-cols-3 gap-3')}>
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative aspect-video overflow-hidden rounded-lg border border-ink-200">
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
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
