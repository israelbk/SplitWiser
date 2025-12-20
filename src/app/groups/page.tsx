'use client';

/**
 * Groups list page
 * List all groups the user is part of
 */

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout';
import { GroupList, GroupForm } from '@/components/features/groups';
import { useCurrentUser, useAuth } from '@/hooks/use-current-user';
import { useGroups, useCreateGroup, useGroupBalances } from '@/hooks/queries';
import { groupService, GroupWithMembers } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function GroupsPage() {
  const { currentUser } = useCurrentUser();
  const { canWrite } = useAuth();
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const t = useTranslations('groups');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groupsWithMembers, setGroupsWithMembers] = useState<GroupWithMembers[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Load groups with members
  useEffect(() => {
    async function loadGroupsWithMembers() {
      if (!groups) {
        setGroupsWithMembers([]);
        setLoadingMembers(false);
        return;
      }

      try {
        const enriched = await Promise.all(
          groups.map((group) => groupService.getGroupWithMembers(group.id))
        );
        setGroupsWithMembers(enriched.filter((g): g is GroupWithMembers => g !== null));
      } catch (error) {
        console.error('Failed to load group members:', error);
      } finally {
        setLoadingMembers(false);
      }
    }

    setLoadingMembers(true);
    loadGroupsWithMembers();
  }, [groups]);

  const handleAddGroup = () => {
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    type: 'trip' | 'household' | 'couple' | 'other';
    memberIds: string[];
  }) => {
    if (!currentUser) return;

    try {
      await createGroup.mutateAsync({
        name: data.name,
        description: data.description,
        type: data.type,
        createdBy: currentUser.id,
        memberIds: data.memberIds,
      });
      toast.success(t('groupCreated'));
      setIsFormOpen(false);
    } catch (error) {
      toast.error(t('failedToCreate'));
    }
  };

  return (
    <AppShell onAddClick={handleAddGroup}>
      <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <Button 
            onClick={handleAddGroup} 
            className="hidden sm:flex"
            disabled={!canWrite}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('createGroup')}
          </Button>
        </div>

        {/* Group List */}
        <GroupList
          groups={groupsWithMembers}
          isLoading={isLoading || loadingMembers}
          onAddClick={handleAddGroup}
        />
      </div>

      {/* Create Group Form */}
      <GroupForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createGroup.isPending}
      />
    </AppShell>
  );
}

