'use client';

/**
 * Group settings dialog
 * Edit all group metadata: name, description, type, and default currency
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyPicker } from '@/components/common';
import { GroupType } from '@/lib/types';
import { Loader2, Plane, Home, Heart, MoreHorizontal } from 'lucide-react';
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
  group: {
    name: string;
    description?: string;
    type: GroupType;
    defaultCurrency: string;
  };
  isLoading?: boolean;
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  onSubmit,
  group,
  isLoading = false,
}: GroupSettingsDialogProps) {
  const t = useTranslations('groupSettings');
  const tTypes = useTranslations('groupTypes');
  const tCommon = useTranslations('common');
  const tGroupForm = useTranslations('groupForm');

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
