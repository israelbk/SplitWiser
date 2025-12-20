'use client';

/**
 * RTL-aware directional icons
 * Automatically flips directional icons (arrows, chevrons) in RTL mode
 */

import { useLocale } from 'next-intl';
import { isRTL } from '@/lib/types/locale';
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DirectionalIconType = 'chevron-right' | 'chevron-left' | 'arrow-right' | 'arrow-left';

interface DirectionalIconProps extends LucideProps {
  /** The base icon type (will flip automatically in RTL) */
  icon: DirectionalIconType;
}

/**
 * A directional icon that automatically flips based on locale direction
 * 
 * @example
 * // Shows ChevronRight in LTR, ChevronLeft in RTL
 * <DirectionalIcon icon="chevron-right" className="h-4 w-4" />
 */
export function DirectionalIcon({ icon, className, ...props }: DirectionalIconProps) {
  const locale = useLocale();
  const rtl = isRTL(locale as 'en' | 'he' | 'es');

  const iconMap: Record<DirectionalIconType, React.ComponentType<LucideProps>> = {
    'chevron-right': rtl ? ChevronLeft : ChevronRight,
    'chevron-left': rtl ? ChevronRight : ChevronLeft,
    'arrow-right': rtl ? ArrowLeft : ArrowRight,
    'arrow-left': rtl ? ArrowRight : ArrowLeft,
  };

  const Icon = iconMap[icon];
  return <Icon className={className} {...props} />;
}

/**
 * Hook to get RTL-aware icon components
 * For when you need the actual component reference
 */
export function useDirectionalIcons() {
  const locale = useLocale();
  const rtl = isRTL(locale as 'en' | 'he' | 'es');

  return {
    ChevronForward: rtl ? ChevronLeft : ChevronRight,
    ChevronBack: rtl ? ChevronRight : ChevronLeft,
    ArrowForward: rtl ? ArrowLeft : ArrowRight,
    ArrowBack: rtl ? ArrowRight : ArrowLeft,
    isRTL: rtl,
  };
}

/**
 * CSS class helper for RTL-aware transformations
 * Use when you need to flip elements via CSS rather than component swap
 */
export function useRTLClasses() {
  const locale = useLocale();
  const rtl = isRTL(locale as 'en' | 'he' | 'es');

  return {
    /** Adds scale-x-[-1] to flip horizontally in RTL */
    flipInRTL: rtl ? 'scale-x-[-1]' : '',
    /** For flex containers that should reverse in RTL */
    flexRTL: rtl ? 'flex-row-reverse' : 'flex-row',
    isRTL: rtl,
  };
}

