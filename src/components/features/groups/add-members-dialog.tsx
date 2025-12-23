'use client';

/**
 * Add Members Dialog
 * Allows group members to invite new members to an existing group
 */

import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] max-h-[500px] flex flex-col px-0">
        <SheetHeader className="px-4 sm:px-6 text-start flex-shrink-0">
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4">
          <div className="px-4 sm:px-6 pb-4">
            <MemberPicker
              currentUser={currentUser}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              existingMembers={existingMembers}
            />
          </div>
        </ScrollArea>

        <SheetFooter className="flex-shrink-0 px-4 sm:px-6 pt-4 border-t flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {tCommon('cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || newMemberIds.length === 0}
            className="flex-1 sm:flex-none"
          >
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {newMemberIds.length > 0 
              ? t('addCount', { count: newMemberIds.length })
              : tCommon('done')
            }
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

