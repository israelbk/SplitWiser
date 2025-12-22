'use client';

/**
 * Icon picker component
 * Displays a grid of selectable icons organized by category
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AVAILABLE_ICONS,
  ICON_CATEGORY_LABELS,
  getIconByName,
  type IconCategory,
} from '@/lib/constants/icons';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color?: string;
  disabled?: boolean;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  color = '#6366f1',
  disabled,
  className,
}: IconPickerProps) {
  const t = useTranslations('categoryForm');
  const [open, setOpen] = useState(false);

  const SelectedIcon = getIconByName(value);

  // Group icons by category
  const iconsByCategory = AVAILABLE_ICONS.reduce(
    (acc, iconDef) => {
      if (!acc[iconDef.category]) {
        acc[iconDef.category] = [];
      }
      acc[iconDef.category].push(iconDef);
      return acc;
    },
    {} as Record<IconCategory, typeof AVAILABLE_ICONS>
  );

  const categories = Object.keys(iconsByCategory) as IconCategory[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-10 w-10 p-0 justify-center',
            className
          )}
          style={{ borderColor: color }}
        >
          <SelectedIcon
            className="h-5 w-5"
            style={{ color }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ScrollArea className="h-80">
          <div className="p-3 space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {ICON_CATEGORY_LABELS[category]}
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {iconsByCategory[category].map((iconDef) => {
                    const Icon = iconDef.icon;
                    const isSelected = value === iconDef.name;
                    return (
                      <button
                        key={iconDef.name}
                        type="button"
                        onClick={() => {
                          onChange(iconDef.name);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-lg border-2 transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent hover:bg-accent'
                        )}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={isSelected ? { color } : undefined}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

