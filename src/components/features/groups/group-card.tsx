'use client';

/**
 * Group card component
 * Displays a group with member avatars and balance preview
 * Mobile-first responsive design
 * Long-press to open settings directly
 * Shows loading indicator when navigating
 */

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { UserAvatar, BalanceAmount, DirectionalIcon } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Plane, Home, Heart, MoreHorizontal, Archive, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroupWithMembers } from '@/lib/services';
import { useTranslations } from 'next-intl';

// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

interface GroupCardProps {
  group: GroupWithMembers;
  currentUserBalance?: number;
  className?: string;
  onSettings?: () => void;
}

const groupTypeIcons = {
  trip: Plane,
  household: Home,
  couple: Heart,
  other: MoreHorizontal,
};

// Colors for group type icons - these are brand colors that work in both light/dark modes
const groupTypeColors = {
  trip: 'oklch(0.65 0.18 195)',      // cyan - vibrant in both modes
  household: 'oklch(0.6 0.2 290)',   // purple - vibrant in both modes
  couple: 'oklch(0.65 0.2 350)',     // pink - vibrant in both modes
  other: 'oklch(0.55 0.02 250)',     // gray - neutral
};

export function GroupCard({ group, currentUserBalance, className, onSettings }: GroupCardProps) {
  const router = useRouter();
  const t = useTranslations('groupForm');
  const tGroups = useTranslations('groups');
  const Icon = groupTypeIcons[group.type] || MoreHorizontal;
  const iconColor = groupTypeColors[group.type] || '#6b7280';
  const hasBalance = currentUserBalance !== undefined && currentUserBalance !== 0;

  // Long press and loading states
  const [isNavigating, setIsNavigating] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Long press handlers
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      // Trigger haptic feedback on mobile if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      // Open settings directly on long press
      onSettings?.();
    }, LONG_PRESS_DURATION);
  }, [onSettings]);

  const handleCardClick = () => {
    // Only navigate if it wasn't a long press and not already navigating
    if (!isLongPress.current && !isNavigating) {
      setIsNavigating(true);
      router.push(`/groups/${group.id}`);
    }
    isLongPress.current = false;
  };

  // Mouse event handlers (for desktop long-press support)
  const handleMouseDown = () => {
    if (onSettings) {
      startLongPress();
    }
  };

  const handleMouseUp = () => {
    clearLongPressTimer();
  };

  const handleMouseLeave = () => {
    clearLongPressTimer();
  };

  // Touch event handlers (for mobile long-press support)
  const handleTouchStart = () => {
    if (onSettings) {
      startLongPress();
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
  };

  const handleTouchCancel = () => {
    clearLongPressTimer();
  };

  // Prevent context menu on long press
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onSettings) {
      e.preventDefault();
    }
  };

  return (
    <Card
        className={cn(
          'p-4 hover:bg-accent/50 transition-colors cursor-pointer select-none',
          group.isArchived && 'opacity-75 border-dashed',
          isNavigating && 'opacity-70',
          className
        )}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onContextMenu={handleContextMenu}
      >
        <div className="flex gap-3">
          {/* Group Icon */}
          <div
            className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center relative"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            {isNavigating ? (
              <Loader2 size={22} className="animate-spin" style={{ color: iconColor }} />
            ) : (
              <Icon size={22} style={{ color: iconColor }} />
            )}
            {group.isArchived && !isNavigating && (
              <div className="absolute -bottom-1 -end-1 bg-muted rounded-full p-0.5">
                <Archive className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Top Row: Name + Badge + Balance */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-base truncate">{group.name}</h3>
                {group.isArchived && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 flex-shrink-0">
                    {tGroups('archived')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {hasBalance && (
                  <BalanceAmount amount={currentUserBalance} size="sm" />
                )}
                <DirectionalIcon icon="chevron-right" className="h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>
            
            {/* Description - full width, shown if exists */}
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {group.description}
              </p>
            )}

            {/* Bottom Row: Members with Avatars */}
            <div className="flex items-center gap-2 mt-1.5">
              {/* Stacked Avatars */}
              {group.members && group.members.length > 0 && (
                <div className="flex items-center -space-x-1.5 rtl:space-x-reverse">
                  {group.members.slice(0, 3).map((member) => (
                    <UserAvatar
                      key={member.userId}
                      user={member.user}
                      size="xs"
                      className="ring-2 ring-background"
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {t('memberCount', { count: group.members?.length || 0 })}
              </span>
            </div>
          </div>
        </div>
      </Card>
  );
}

