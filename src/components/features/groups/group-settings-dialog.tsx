'use client';

/**
 * Group settings dialog
 * Edit all group metadata: name, description, type, and default currency
 * Also provides archive and delete options
 */

import { useEffect, useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CurrencyPicker } from '@/components/common';
import { GroupType } from '@/lib/types';
import { Loader2, Plane, Home, Heart, MoreHorizontal, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import { useTranslations } from 'next-intl';

const groupSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['trip', 'household', 'couple', 'other']),
  defaultCurrency: z.string().min(1, 'Currency is required'),
});

type GroupSettingsFormData = z.infer<typeof groupSettingsSchema>;

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GroupSettingsFormData) => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
  group: {
    name: string;
    description?: string;
    type: GroupType;
    defaultCurrency: string;
    isArchived?: boolean;
  };
  isLoading?: boolean;
  isArchiving?: boolean;
  isDeleting?: boolean;
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  onSubmit,
  onArchive,
  onUnarchive,
  onDelete,
  group,
  isLoading = false,
  isArchiving = false,
  isDeleting = false,
}: GroupSettingsDialogProps) {
  const t = useTranslations('groupSettings');
  const tTypes = useTranslations('groupTypes');
  const tCommon = useTranslations('common');
  const tGroupForm = useTranslations('groupForm');

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const groupTypes = [
    { value: 'trip', label: tTypes('trip'), icon: Plane },
    { value: 'household', label: tTypes('household'), icon: Home },
    { value: 'couple', label: tTypes('couple'), icon: Heart },
    { value: 'other', label: tTypes('other'), icon: MoreHorizontal },
  ];

  const form = useForm<GroupSettingsFormData>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: group.name,
      description: group.description || '',
      type: group.type,
      defaultCurrency: group.defaultCurrency,
    },
  });

  // Reset form when dialog opens with new group data
  useEffect(() => {
    if (open) {
      form.reset({
        name: group.name,
        description: group.description || '',
        type: group.type,
        defaultCurrency: group.defaultCurrency,
      });
    }
  }, [open, group, form]);

  const handleSubmit = (data: GroupSettingsFormData) => {
    onSubmit(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleArchive = () => {
    setShowArchiveConfirm(false);
    onOpenChange(false);
    if (group.isArchived) {
      onUnarchive?.();
    } else {
      onArchive?.();
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onOpenChange(false);
    onDelete?.();
  };

  const isAnyLoading = isLoading || isArchiving || isDeleting;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[650px] flex flex-col px-0">
          <SheetHeader className="px-4 sm:px-6 text-start flex-shrink-0">
            <SheetTitle>{t('title')}</SheetTitle>
            <SheetDescription>{t('description')}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4">
            <form id="group-settings-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-4 sm:px-6">
              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{tGroupForm('groupName')}</Label>
                <Input
                  id="name"
                  placeholder={tGroupForm('namePlaceholder')}
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {tGroupForm('validation.nameRequired')}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{tGroupForm('descriptionLabel')}</Label>
                <Input
                  id="description"
                  placeholder={tGroupForm('descriptionPlaceholder')}
                  {...form.register('description')}
                />
              </div>

              {/* Group Type */}
              <div className="space-y-2">
                <Label>{tGroupForm('type')}</Label>
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

              {/* Default Currency */}
              <div className="space-y-2">
                <Label>{t('defaultCurrency')}</Label>
                <CurrencyPicker
                  value={form.watch('defaultCurrency')}
                  onChange={(currency) => form.setValue('defaultCurrency', currency)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('defaultCurrencyHint')}
                </p>
              </div>

              {/* Danger Zone */}
              {(onArchive || onUnarchive || onDelete) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3 pb-4">
                    <Label className="text-destructive">{t('dangerZone')}</Label>
                    <div className="flex flex-col gap-2">
                      {/* Archive/Unarchive Button */}
                      {(onArchive || onUnarchive) && (
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-start"
                          onClick={() => setShowArchiveConfirm(true)}
                          disabled={isAnyLoading}
                        >
                          {isArchiving ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          ) : group.isArchived ? (
                            <ArchiveRestore className="me-2 h-4 w-4" />
                          ) : (
                            <Archive className="me-2 h-4 w-4" />
                          )}
                          {group.isArchived ? t('unarchiveGroup') : t('archiveGroup')}
                        </Button>
                      )}
                      {/* Delete Button */}
                      {onDelete && (
                        <Button
                          type="button"
                          variant="destructive"
                          className="justify-start"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isAnyLoading}
                        >
                          {isDeleting ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="me-2 h-4 w-4" />
                          )}
                          {t('deleteGroup')}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </form>
          </ScrollArea>

          <SheetFooter className="flex-shrink-0 px-4 sm:px-6 pt-4 border-t flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAnyLoading}
              className="flex-1 sm:flex-none"
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" form="group-settings-form" disabled={isAnyLoading} className="flex-1 sm:flex-none">
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {group.isArchived ? t('unarchiveConfirmTitle') : t('archiveConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {group.isArchived 
                ? t('unarchiveConfirmDescription', { name: group.name })
                : t('archiveConfirmDescription', { name: group.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {group.isArchived ? t('unarchiveGroup') : t('archiveGroup')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{t('deleteConfirmDescription', { name: group.name })}</span>
              <span className="block font-semibold text-destructive">
                {t('deleteWarning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('deleteGroup')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
