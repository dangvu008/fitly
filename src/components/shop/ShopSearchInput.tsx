/**
 * ShopSearchInput - Search input with URL detection and keyword search
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { useState, useCallback } from 'react';
import { Search, Loader2, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ShopSearchInputProps {
  onSearch: (query: string) => void;
  onUrlDetected: (url: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

// URL detection regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

// Check if string is a valid URL
function isValidUrl(str: string): boolean {
  try {
    // Check with regex first
    if (!URL_REGEX.test(str)) return false;
    // Try to construct URL
    new URL(str.startsWith('http') ? str : `https://${str}`);
    return true;
  } catch {
    return false;
  }
}

export function ShopSearchInput({
  onSearch,
  onUrlDetected,
  isLoading = false,
  placeholder = "Paste Link or Search 'Denim Jacket'...",
  className,
}: ShopSearchInputProps) {
  const [value, setValue] = useState('');
  const [isUrl, setIsUrl] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Check if it's a URL
    const urlDetected = isValidUrl(newValue.trim());
    setIsUrl(urlDetected);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    
    if (!trimmedValue) return;

    if (isUrl) {
      // It's a URL - trigger visual search
      const url = trimmedValue.startsWith('http') 
        ? trimmedValue 
        : `https://${trimmedValue}`;
      onUrlDetected(url);
    } else {
      // It's a keyword search
      onSearch(trimmedValue);
    }
  }, [value, isUrl, onSearch, onUrlDetected]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim();
    
    // Auto-detect URL on paste
    if (isValidUrl(pastedText)) {
      setIsUrl(true);
      // Auto-submit URL after short delay
      setTimeout(() => {
        const url = pastedText.startsWith('http') 
          ? pastedText 
          : `https://${pastedText}`;
        onUrlDetected(url);
      }, 100);
    }
  }, [onUrlDetected]);

  return (
    <form onSubmit={handleSubmit} className={cn('', className)}>
      <div className="relative">
        {/* Icon - changes based on URL detection */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : isUrl ? (
            <Link2 className="h-4 w-4 text-primary" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'pl-9 pr-4 h-10 text-sm bg-secondary/50 border-0 rounded-xl',
            'focus-visible:ring-2 focus-visible:ring-primary/50',
            isUrl && 'ring-2 ring-primary/50'
          )}
        />

        {/* URL indicator badge */}
        {isUrl && !isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              URL
            </span>
          </div>
        )}
      </div>
    </form>
  );
}
