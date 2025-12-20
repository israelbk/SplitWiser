'use client';

/**
 * Group card component
 * Displays a group with member avatars and balance preview
 * Mobile-first responsive design
 */

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { UserAvatar, BalanceAmount } from '@/components/common';
import { ChevronRight, Plane, Home, Heart, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroupWithMembers } from '@/lib/services';

interface GroupCardProps {
  group: GroupWithMembers;
  currentUserBalance?: number;
  className?: string;
}

const groupTypeIcons = {
  trip: Plane,
  household: Home,
  couple: Heart,
  other: MoreHorizontal,
};

const groupTypeColors = {
  trip: '#06b6d4',
  household: '#8b5cf6',
  couple: '#ec4899',
  other: '#6b7280',
};

export function GroupCard({ group, currentUserBalance, className }: GroupCardProps) {
  const Icon = groupTypeIcons[group.type] || MoreHorizontal;
  const iconColor = groupTypeColors[group.type] || '#6b7280';
  const hasBalance = currentUserBalance !== undefined && currentUserBalance !== 0;

  return (
    <Link href={`/groups/${group.id}`}>
      <Card
        className={cn(
          'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
          className
        )}
      >
        <div className="flex gap-3">
          {/* Group Icon */}
          <div
            className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon size={22} style={{ color: iconColor }} />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Top Row: Name + Balance */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base truncate">{group.name}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {hasBalance && (
                  <BalanceAmount amount={currentUserBalance} size="sm" />
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
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
                <div className="flex items-center -space-x-1.5">
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
                {group.members?.length || 0} members
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

