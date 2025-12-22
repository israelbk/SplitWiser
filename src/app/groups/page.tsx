'use client';

/**
 * Groups list page
 * List all groups the user is part of
 * 
 * Performance: Uses batch query to fetch all groups with members
 * in just 3 DB calls instead of N+1
 */

import { useState } from 'react';
import { AppShell } from '@/components/layout';
import { GroupList, GroupForm } from '@/components/features/groups';
import { useCurrentUser, useAuth } from '@/hooks/use-current-user';
import { useGroupsForUserWithMembers, useCreateGroup } from '@/hooks/queries';
import { userService } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function GroupsPage() {
  const { currentUser } = useCurrentUser();
  const { canWrite } = useAuth();
  const t = useTranslations('groups');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Optimized: fetch groups WITH members in a single batch query
  const { data: groupsWithMembers, isLoading } = useGroupsForUserWithMembers(currentUser?.id, showArchived);
  const createGroup = useCreateGroup();

  // Separate active and archived groups for display
  const activeGroups = groupsWithMembers?.filter(g => !g.isArchived) ?? [];
  const archivedGroups = groupsWithMembers?.filter(g => g.isArchived) ?? [];

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
      // Get emails from member IDs
      const members = await userService.getUsersByIds(data.memberIds);
      const memberEmails = members.map(m => m.email);
      
      await createGroup.mutateAsync({
        name: data.name,
        description: data.description,
        type: data.type,
        creatorEmail: currentUser.email,
        memberEmails: memberEmails,
      });
      toast.success(t('groupCreated'));
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
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
            <Plus className="h-4 w-4 me-2" />
            {t('createGroup')}
          </Button>
        </div>

        {/* Active Groups */}
        <GroupList
          groups={activeGroups}
          isLoading={isLoading}
          onAddClick={handleAddGroup}
        />

        {/* Show Archived Toggle */}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(checked) => setShowArchived(checked === true)}
          />
          <Label 
            htmlFor="show-archived" 
            className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            {t('showArchived')}
          </Label>
        </div>

        {/* Archived Groups Section */}
        {showArchived && archivedGroups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
              <Archive className="h-5 w-5" />
              {t('archivedGroups')}
            </h2>
            <div className="opacity-75">
              <GroupList
                groups={archivedGroups}
                isLoading={false}
              />
            </div>
          </div>
        )}
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

