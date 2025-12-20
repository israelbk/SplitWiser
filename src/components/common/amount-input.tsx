'use client';

/**
 * Amount input component
 * Currency-aware input with formatting
 */

import { Input } from '@/components/ui/input';
import { getCurrency, DEFAULT_CURRENCY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { forwardRef, useState, useEffect } from 'react';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      value,
      onChange,
      currency = DEFAULT_CURRENCY,
      className,
      disabled,
      placeholder = '0.00',
    },
    ref
  ) => {
    const currencyInfo = getCurrency(currency);
    const [inputValue, setInputValue] = useState(value ? value.toString() : '');

    // Sync input value when external value changes
    useEffect(() => {
      if (value === 0) {
        setInputValue('');
      } else if (value !== parseFloat(inputValue)) {
        setInputValue(value.toString());
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      
      // Allow empty string
      if (rawValue === '') {
        setInputValue('');
        onChange(0);
        return;
      }

      // Only allow numbers and decimal point
      const cleaned = rawValue.replace(/[^\d.]/g, '');
      
      // Prevent multiple decimal points
      const parts = cleaned.split('.');
      let formatted = parts[0];
      if (parts.length > 1) {
        formatted += '.' + parts[1].slice(0, currencyInfo.decimals);
      }

      setInputValue(formatted);
      
      const numValue = parseFloat(formatted);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    };

    const handleBlur = () => {
      // Format on blur
      if (inputValue && !isNaN(parseFloat(inputValue))) {
        const numValue = parseFloat(inputValue);
        setInputValue(numValue.toFixed(currencyInfo.decimals));
        onChange(numValue);
      }
    };

    return (
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
          {currencyInfo.symbol}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn('ps-8 text-end font-mono h-10', className)}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

