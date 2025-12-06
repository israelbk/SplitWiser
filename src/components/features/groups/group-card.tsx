'use client';

/**
 * Group card component
 * Displays a group with member avatars and balance preview
 */

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Group } from '@/lib/types';
import { UserAvatar, BalanceAmount } from '@/components/common';
import { Users, ChevronRight, Plane, Home, Heart, MoreHorizontal } from 'lucide-react';
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

  return (
    <Link href={`/groups/${group.id}`}>
      <Card
        className={cn(
          'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Group Icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon size={24} style={{ color: iconColor }} />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{group.members?.length || 0} members</span>
              {group.description && (
                <>
                  <span>•</span>
                  <span className="truncate">{group.description}</span>
                </>
              )}
            </div>
          </div>

          {/* Balance & Arrow */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentUserBalance !== undefined && currentUserBalance !== 0 && (
              <BalanceAmount amount={currentUserBalance} size="sm" />
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Member Avatars */}
        {group.members && group.members.length > 0 && (
          <div className="flex items-center mt-3 -space-x-2">
            {group.members.slice(0, 5).map((member) => (
              <UserAvatar
                key={member.userId}
                user={member.user}
                size="sm"
                className="ring-2 ring-background"
              />
            ))}
            {group.members.length > 5 && (
              <span className="text-xs text-muted-foreground ml-2">
                +{group.members.length - 5} more
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}

