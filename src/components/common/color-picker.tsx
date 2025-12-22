'use client';

/**
 * Color picker component
 * Displays a grid of preset colors for category customization
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check } from 'lucide-react';
import { AVAILABLE_COLORS } from '@/lib/constants/icons';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  disabled,
  className,
}: ColorPickerProps) {
  const t = useTranslations('categoryForm');
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-10 w-10 p-0 justify-center border-2',
            className
          )}
          style={{ 
            backgroundColor: value,
            borderColor: value,
          }}
        >
          <span className="sr-only">{t('selectColor')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {AVAILABLE_COLORS.map((color) => {
            const isSelected = value === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-lg transition-all',
                  'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  isSelected && 'ring-2 ring-ring ring-offset-2'
                )}
                style={{ backgroundColor: color }}
              >
                {isSelected && (
                  <Check 
                    className="h-4 w-4" 
                    style={{ 
                      color: getContrastColor(color) 
                    }} 
                  />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Get contrasting text color (black or white) for a background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

