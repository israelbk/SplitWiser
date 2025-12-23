'use client';

/**
 * Group form component
 * Create/edit group dialog
 */

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/use-current-user';
import { MemberPicker } from '@/components/common';
import { Group, GroupMember, GroupType, User } from '@/lib/types';
import { Loader2, Plane, Home, Heart, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Extended Group type that includes populated members (from GroupWithMembers)
interface GroupWithPopulatedMembers extends Partial<Group> {
  members?: (GroupMember & { user: User })[];
}

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['trip', 'household', 'couple', 'other']),
  // Minimum 2 members: current user (always included) + at least 1 other member
  memberIds: z.array(z.string()).min(2, 'Select at least one other member'),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GroupFormData) => void;
  group?: GroupWithPopulatedMembers;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function GroupForm({
  open,
  onOpenChange,
  onSubmit,
  group,
  title,
  description,
  isLoading = false,
}: GroupFormProps) {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('groupForm');
  const tTypes = useTranslations('groupTypes');
  const tCommon = useTranslations('common');
  
  // Track selected member IDs separately for the MemberPicker
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const groupTypes = [
    { value: 'trip', label: tTypes('trip'), icon: Plane },
    { value: 'household', label: tTypes('household'), icon: Home },
    { value: 'couple', label: tTypes('couple'), icon: Heart },
    { value: 'other', label: tTypes('other'), icon: MoreHorizontal },
  ];

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      type: (group?.type as GroupType) || 'trip',
      memberIds: currentUser ? [currentUser.id] : [],
    },
  });

  // Extract users from populated members
  const existingMemberUsers = useMemo(() => {
    if (!group?.members) return [];
    return group.members
      .filter(m => m.user)
      .map(m => m.user);
  }, [group?.members]);

  // Initialize selected members when dialog opens
  useEffect(() => {
    if (open && currentUser) {
      const initialIds = group?.members?.map(m => m.userId) || [currentUser.id];
      // Ensure current user is always included
      if (!initialIds.includes(currentUser.id)) {
        initialIds.unshift(currentUser.id);
      }
      setSelectedMemberIds(initialIds);
      form.setValue('memberIds', initialIds);
    }
  }, [open, currentUser, group, form]);

  // Sync memberIds with form when selection changes
  const handleMemberSelectionChange = (ids: string[]) => {
    setSelectedMemberIds(ids);
    form.setValue('memberIds', ids, { shouldValidate: true });
  };

  // Watch form values to enable/disable submit button
  const watchedName = form.watch('name');
  const isFormValid = watchedName.trim().length > 0 && selectedMemberIds.length >= 2;

  const handleSubmit = (data: GroupFormData) => {
    onSubmit(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      if (currentUser) {
        const defaultIds = [currentUser.id];
        form.reset({
          name: '',
          description: '',
          type: 'trip',
          memberIds: defaultIds,
        });
        setSelectedMemberIds(defaultIds);
      }
    }
    onOpenChange(newOpen);
  };

  const displayTitle = title ?? (group?.id ? t('editTitle') : t('title'));
  const displayDescription = description ?? t('description');

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] max-h-[600px] flex flex-col px-0">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 text-start flex-shrink-0">
            <SheetTitle>{displayTitle}</SheetTitle>
            <SheetDescription>{displayDescription}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid gap-4 px-4 sm:px-6 pb-4">
              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('groupName')}</Label>
                <Input
                  id="name"
                  placeholder={t('namePlaceholder')}
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {t('validation.nameRequired')}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('descriptionLabel')}</Label>
                <Input
                  id="description"
                  placeholder={t('descriptionPlaceholder')}
                  {...form.register('description')}
                />
              </div>

              {/* Group Type */}
              <div className="space-y-2">
                <Label>{t('type')}</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(value) => form.setValue('type', value as GroupType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Members */}
              <div className="space-y-2">
                <Label>{t('members')}</Label>
                {currentUser && (
                  <MemberPicker
                    currentUser={currentUser}
                    selectedIds={selectedMemberIds}
                    onSelectionChange={handleMemberSelectionChange}
                    existingMembers={existingMemberUsers}
                  />
                )}
                {form.formState.errors.memberIds && (
                  <p className="text-sm text-destructive">
                    {t('validation.selectMember')}
                  </p>
                )}
              </div>
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
            <Button type="submit" disabled={isLoading || !isFormValid} className="flex-1 sm:flex-none">
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {group?.id ? tCommon('update') : tCommon('create')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
