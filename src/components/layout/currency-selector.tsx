'use client';

/**
 * Currency selector component for the header
 * Allows users to set their display currency and conversion mode
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRightLeft, 
  ChevronDown,
  Clock,
  Zap,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencySettings } from '@/hooks/queries';
import { CurrencyPicker } from '@/components/common/currency-picker';
import { getCurrency } from '@/lib/constants';
import { ConversionMode } from '@/lib/types';
import { useTranslations } from 'next-intl';

export function CurrencySelector() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('currency');
  const {
    displayCurrency,
    conversionMode,
    isLoading,
    isUpdating,
    setDisplayCurrency,
    setConversionMode,
  } = useCurrencySettings();

  const currency = getCurrency(displayCurrency);
  const isConverting = conversionMode !== 'off';

  const CONVERSION_MODE_OPTIONS: {
    value: ConversionMode;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'off',
      label: t('original'),
      description: t('originalDescription'),
      icon: <X className="h-4 w-4" />,
    },
    {
      value: 'simple',
      label: t('currentRate'),
      description: t('currentRateDescription'),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      value: 'smart',
      label: t('historicalRate'),
      description: t('historicalRateDescription'),
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5 h-8 px-2',
            isConverting && 'text-primary'
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="font-medium">{currency.symbol}</span>
              {isConverting && (
                <ArrowRightLeft className="h-3.5 w-3.5" />
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="p-3 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">{t('settings')}</h4>
            {isUpdating && (
              <Loader2 className="h-3 w-3 animate-spin ms-auto text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('convertExpenses')}
          </p>
        </div>

        <Separator />

        {/* Display Currency Selection */}
        <div className="p-3">
          <Label className="text-xs text-muted-foreground mb-2 block">
            {t('displayCurrency')}
          </Label>
          <CurrencyPicker
            value={displayCurrency}
            onChange={setDisplayCurrency}
            disabled={isUpdating}
          />
        </div>

        <Separator />

        {/* Conversion Mode Selection */}
        <div className="p-3">
          <Label className="text-xs text-muted-foreground mb-2 block">
            {t('conversionMode')}
          </Label>
          <div className="space-y-1">
            {CONVERSION_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConversionMode(option.value)}
                disabled={isUpdating}
                className={cn(
                  'w-full flex items-start gap-3 rounded-md p-2 text-start transition-colors',
                  'hover:bg-accent disabled:opacity-50',
                  conversionMode === option.value && 'bg-accent'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border',
                    conversionMode === option.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {conversionMode === option.value && option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info note */}
        {conversionMode === 'smart' && (
          <>
            <Separator />
            <div className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                {t('smartConversionInfo')}
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

