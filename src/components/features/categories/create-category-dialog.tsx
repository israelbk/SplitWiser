'use client';

/**
 * Create category dialog component
 * Reusable dialog for creating custom categories
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/common/icon-picker';
import { ColorPicker } from '@/components/common/color-picker';
import { useCreateCategory } from '@/hooks/queries';
import { useAuth } from '@/hooks/use-current-user';
import { AVAILABLE_COLORS } from '@/lib/constants/icons';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when category is successfully created, with the new category ID */
  onCreated?: (categoryId: string) => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCategoryDialogProps) {
  const t = useTranslations('categoryManager');
  const { effectiveUser } = useAuth();
  const userId = effectiveUser?.id;

  const createCategory = useCreateCategory();

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('utensils');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setIcon('utensils');
      setColor(AVAILABLE_COLORS[0]);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!userId || !name.trim()) return;

    try {
      const newCategory = await createCategory.mutateAsync({
        name: name.trim(),
        icon,
        color,
        createdBy: userId,
      });
      
      toast.success(t('createSuccess'));
      onOpenChange(false);
      
      // Notify parent with the new category ID
      if (onCreated && newCategory) {
        onCreated(newCategory.id);
      }
    } catch (error) {
      toast.error(t('createError'));
      console.error('Failed to create category:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newCategory')}</DialogTitle>
          <DialogDescription>{t('newCategoryDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Icon and Color pickers side by side */}
          <div className="flex items-start gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('icon')}</Label>
              <IconPicker value={icon} onChange={setIcon} color={color} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('color')}</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>

          {/* Category name input */}
          <div className="space-y-2">
            <Label htmlFor="category-name">{t('categoryName')}</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createCategory.isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createCategory.isPending}
          >
            {createCategory.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Plus className="h-4 w-4 me-2" />
            )}
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

