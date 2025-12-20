'use client';

/**
 * Language selector component for the header
 * Allows users to change the app language
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Globe, ChevronDown, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageSettings } from '@/hooks/queries';
import { LOCALES, Locale, SUPPORTED_LOCALES, getLocaleInfo } from '@/lib/types/locale';
import { useTranslations } from 'next-intl';

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('language');
  const { language, setLanguage, isUpdating } = useLanguageSettings();

  const currentLocale = getLocaleInfo(language);

  const handleLanguageChange = (newLocale: Locale) => {
    setLanguage(newLocale);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 px-2"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="text-base">{currentLocale.flag}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <div className="p-3 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">{t('settings')}</h4>
            {isUpdating && (
              <Loader2 className="h-3 w-3 animate-spin ms-auto text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('selectLanguage')}
          </p>
        </div>

        {/* Language Options */}
        <div className="p-2">
          {SUPPORTED_LOCALES.map((locale) => {
            const localeInfo = LOCALES[locale];
            const isSelected = language === locale;

            return (
              <button
                key={locale}
                type="button"
                onClick={() => handleLanguageChange(locale)}
                disabled={isUpdating}
                className={cn(
                  'w-full flex items-center gap-3 rounded-md p-2 text-start transition-colors',
                  'hover:bg-accent disabled:opacity-50',
                  isSelected && 'bg-accent'
                )}
              >
                <span className="text-xl">{localeInfo.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{localeInfo.nativeName}</div>
                  <div className="text-xs text-muted-foreground">
                    {localeInfo.name}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

