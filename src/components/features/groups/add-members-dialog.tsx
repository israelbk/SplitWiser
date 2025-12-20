'use client';

/**
 * Add Members Dialog
 * Allows group members to invite new members to an existing group
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MemberPicker } from '@/components/common';
import { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  existingMemberIds: string[];
  existingMembers: User[];
  onAddMembers: (newMemberIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function AddMembersDialog({
  open,
  onOpenChange,
  currentUser,
  existingMemberIds,
  existingMembers,
  onAddMembers,
  isLoading = false,
}: AddMembersDialogProps) {
  const t = useTranslations('addMembers');
  const tCommon = useTranslations('common');
  
  // Track selected members - start with existing members
  const [selectedIds, setSelectedIds] = useState<string[]>(existingMemberIds);

  // Reset when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset to existing members when opening
      setSelectedIds(existingMemberIds);
    }
    onOpenChange(newOpen);
  };

  // Calculate new members to add
  const newMemberIds = useMemo(() => {
    return selectedIds.filter(id => !existingMemberIds.includes(id));
  }, [selectedIds, existingMemberIds]);

  const handleSubmit = async () => {
    if (newMemberIds.length === 0) {
      onOpenChange(false);
      return;
    }
    
    await onAddMembers(newMemberIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <MemberPicker
            currentUser={currentUser}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            existingMembers={existingMembers}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || newMemberIds.length === 0}
          >
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {newMemberIds.length > 0 
              ? t('addCount', { count: newMemberIds.length })
              : tCommon('done')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

