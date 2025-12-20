'use client';

/**
 * Group list component
 * Displays a list of groups
 */

import { GroupCard } from './group-card';
import { EmptyState, GroupListSkeleton } from '@/components/common';
import { Users } from 'lucide-react';
import { GroupWithMembers } from '@/lib/services';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('groups');

  if (isLoading) {
    return <GroupListSkeleton count={3} />;
  }

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('noGroups')}
        description={t('noGroupsDescription')}
        action={
          onAddClick
            ? {
                label: t('createGroup'),
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

