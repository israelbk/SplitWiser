'use client';

/**
 * Settings sheet component
 * Unified bottom sheet for all user preferences:
 * - Theme (Light/Dark/System)
 * - Language (English/Hebrew/Spanish)
 * - Currency display and conversion mode
 */

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Globe,
  ArrowRightLeft,
  Check,
  Clock,
  Zap,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencySettings, useLanguageSettings } from '@/hooks/queries';
import { CurrencyPicker } from '@/components/common/currency-picker';
import { LOCALES, Locale, SUPPORTED_LOCALES } from '@/lib/types/locale';
import { ConversionMode } from '@/lib/types';

export function SettingsSheet() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('settings');
  const tCurrency = useTranslations('currency');
  const tLanguage = useTranslations('language');
  
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, isUpdating: isUpdatingLanguage } = useLanguageSettings();
  const {
    displayCurrency,
    conversionMode,
    isLoading: isLoadingCurrency,
    isUpdating: isUpdatingCurrency,
    setDisplayCurrency,
    setConversionMode,
  } = useCurrencySettings();

  const isUpdating = isUpdatingLanguage || isUpdatingCurrency;

  // Theme options
  const themeOptions = [
    { value: 'light', label: t('light'), icon: Sun },
    { value: 'dark', label: t('dark'), icon: Moon },
    { value: 'system', label: t('system'), icon: Monitor },
  ] as const;

  // Conversion mode options
  const conversionModeOptions: {
    value: ConversionMode;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'off',
      label: tCurrency('original'),
      description: tCurrency('originalDescription'),
      icon: <X className="h-4 w-4" />,
    },
    {
      value: 'simple',
      label: tCurrency('currentRate'),
      description: tCurrency('currentRateDescription'),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      value: 'smart',
      label: tCurrency('historicalRate'),
      description: tCurrency('historicalRateDescription'),
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  const handleLanguageChange = (newLocale: Locale) => {
    setLanguage(newLocale);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
          <span className="sr-only">{t('title')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] max-h-[600px] flex flex-col px-0">
        <SheetHeader className="px-4 sm:px-6 text-start">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('title')}
          </SheetTitle>
          <SheetDescription>
            {t('description')}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-6 px-4 sm:px-6 pb-6">
            {/* ============================================================
                APPEARANCE SECTION
                ============================================================ */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('appearance')}
                </Label>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map(({ value, label, icon: Icon }) => {
                  const isSelected = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-accent'
                      )}
                    >
                      <Icon className={cn(
                        'h-6 w-6',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* ============================================================
                LANGUAGE SECTION
                ============================================================ */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {tLanguage('settings')}
                </Label>
                {isUpdatingLanguage && (
                  <Loader2 className="h-3 w-3 animate-spin ms-auto text-muted-foreground" />
                )}
              </div>

              <div className="space-y-1">
                {SUPPORTED_LOCALES.map((locale) => {
                  const localeInfo = LOCALES[locale];
                  const isSelected = language === locale;

                  return (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => handleLanguageChange(locale)}
                      disabled={isUpdatingLanguage}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl border-2 p-3 text-start transition-all',
                        'disabled:opacity-50',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-accent'
                      )}
                    >
                      <span className="text-2xl">{localeInfo.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{localeInfo.nativeName}</div>
                        <div className="text-xs text-muted-foreground">
                          {localeInfo.name}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* ============================================================
                CURRENCY SECTION
                ============================================================ */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {tCurrency('settings')}
                </Label>
                {isUpdatingCurrency && (
                  <Loader2 className="h-3 w-3 animate-spin ms-auto text-muted-foreground" />
                )}
              </div>

              {/* Display Currency */}
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  {tCurrency('displayCurrency')}
                </Label>
                <CurrencyPicker
                  value={displayCurrency}
                  onChange={setDisplayCurrency}
                  disabled={isUpdatingCurrency || isLoadingCurrency}
                />
              </div>

              {/* Conversion Mode */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  {tCurrency('conversionMode')}
                </Label>
                <div className="space-y-1">
                  {conversionModeOptions.map((option) => {
                    const isSelected = conversionMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setConversionMode(option.value)}
                        disabled={isUpdatingCurrency}
                        className={cn(
                          'w-full flex items-start gap-3 rounded-xl border-2 p-3 text-start transition-all',
                          'disabled:opacity-50',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-accent'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {isSelected && option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart conversion info */}
              {conversionMode === 'smart' && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground">
                    {tCurrency('smartConversionInfo')}
                  </p>
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

