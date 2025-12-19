'use client';

/**
 * Currency picker component
 * Dropdown for selecting currency with primary currencies at top
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Currency,
  PRIMARY_CURRENCIES,
  SECONDARY_CURRENCIES,
  getCurrency,
} from '@/lib/constants';

interface CurrencyPickerProps {
  value: string;
  onChange: (currencyCode: string) => void;
  disabled?: boolean;
  className?: string;
  /** Show compact version (symbol only) */
  compact?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export function CurrencyPicker({
  value,
  onChange,
  disabled = false,
  className,
  compact = false,
  placeholder = 'Select currency',
}: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  const selectedCurrency = getCurrency(value);

  const handleSelect = (currency: Currency) => {
    onChange(currency.code);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'justify-between font-normal',
            compact ? 'w-[70px] px-2' : 'w-full',
            className
          )}
        >
          {value ? (
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{selectedCurrency.symbol}</span>
              {!compact && (
                <span className="text-muted-foreground">
                  {selectedCurrency.code}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="flex flex-col">
          {/* Primary currencies */}
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Common
            </div>
            {PRIMARY_CURRENCIES.map((currency) => (
              <CurrencyOption
                key={currency.code}
                currency={currency}
                isSelected={value === currency.code}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Separator */}
          <div className="h-px bg-border" />

          {/* Secondary currencies toggle */}
          <button
            type="button"
            className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => setShowSecondary(!showSecondary)}
          >
            <span>More currencies</span>
            {showSecondary ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Secondary currencies (expandable) */}
          {showSecondary && (
            <div className="p-1 border-t">
              {SECONDARY_CURRENCIES.map((currency) => (
                <CurrencyOption
                  key={currency.code}
                  currency={currency}
                  isSelected={value === currency.code}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface CurrencyOptionProps {
  currency: Currency;
  isSelected: boolean;
  onSelect: (currency: Currency) => void;
}

function CurrencyOption({ currency, isSelected, onSelect }: CurrencyOptionProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent'
      )}
      onClick={() => onSelect(currency)}
    >
      <span className="w-6 font-medium">{currency.symbol}</span>
      <span className="flex-1 text-left">{currency.name}</span>
      <span className="text-xs text-muted-foreground">{currency.code}</span>
      {isSelected && <Check className="h-4 w-4" />}
    </button>
  );
}

/**
 * Inline currency selector (for use next to amount input)
 */
interface InlineCurrencyPickerProps {
  value: string;
  onChange: (currencyCode: string) => void;
  disabled?: boolean;
}

export function InlineCurrencyPicker({
  value,
  onChange,
  disabled = false,
}: InlineCurrencyPickerProps) {
  return (
    <CurrencyPicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      compact
      className="rounded-l-none border-l-0"
    />
  );
}

