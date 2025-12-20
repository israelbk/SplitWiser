'use client';

/**
 * Group list component
 * Displays a list of groups
 */

import { GroupCard } from './group-card';
import { EmptyState, GroupListSkeleton } from '@/components/common';
import { Users } from 'lucide-react';
import { GroupWithMembers } from '@/lib/services';

interface GroupListProps {
  groups: GroupWithMembers[] | undefined;
  isLoading: boolean;
  userBalances?: Record<string, number>;
  onAddClick?: () => void;
}

export function GroupList({
  groups,
  isLoading,
  userBalances = {},
  onAddClick,
}: GroupListProps) {
  if (isLoading) {
    return <GroupListSkeleton count={3} />;
  }

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No groups yet"
        description="Create a group to start splitting expenses with friends."
        action={
          onAddClick
            ? {
                label: 'Create Group',
                onClick: onAddClick,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          currentUserBalance={userBalances[group.id]}
        />
      ))}
    </div>
  );
}

