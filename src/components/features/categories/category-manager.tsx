'use client';

/**
 * Category manager component
 * Allows users to view, create, and delete custom categories
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-current-user';
import {
  useUserCategories,
  useSystemCategories,
  useCreateCategory,
  useDeleteCategoryWithReplacement,
  useCategoryExpenseCount,
} from '@/hooks/queries';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { IconPicker } from '@/components/common/icon-picker';
import { ColorPicker } from '@/components/common/color-picker';
import { DeleteCategoryDialog } from './delete-category-dialog';
import { getIconByName, AVAILABLE_COLORS } from '@/lib/constants/icons';
import { Plus, Trash2, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const t = useTranslations('categoryManager');
  const tCategories = useTranslations('categories');
  const { effectiveUser } = useAuth();
  const userId = effectiveUser?.id;

  // Queries
  const { data: categories, isLoading } = useUserCategories(userId);
  const { data: systemCategories } = useSystemCategories();

  // Mutations
  const createCategory = useCreateCategory();
  const deleteCategoryWithReplacement = useDeleteCategoryWithReplacement();

  // Form state for new category
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('utensils');
  const [newColor, setNewColor] = useState(AVAILABLE_COLORS[0]);

  // Delete dialog state
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [deleteExpenseCount, setDeleteExpenseCount] = useState(0);

  // Get expense count for category being deleted
  const { data: expenseCount } = useCategoryExpenseCount(
    deleteCategory?.id,
    userId
  );

  // Update expense count when it changes
  if (expenseCount !== undefined && expenseCount !== deleteExpenseCount && deleteCategory) {
    setDeleteExpenseCount(expenseCount);
  }

  const handleCreate = async () => {
    if (!userId || !newName.trim()) return;

    try {
      await createCategory.mutateAsync({
        name: newName.trim(),
        icon: newIcon,
        color: newColor,
        createdBy: userId,
      });
      toast.success(t('createSuccess'));
      // Reset form
      setNewName('');
      setNewIcon('utensils');
      setNewColor(AVAILABLE_COLORS[0]);
      setIsCreating(false);
    } catch (error) {
      toast.error(t('createError'));
      console.error('Failed to create category:', error);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteCategory(category);
    setDeleteExpenseCount(0); // Will be updated by the query
  };

  const handleDeleteConfirm = async (replacementCategoryId: string) => {
    if (!deleteCategory || !userId) return;

    try {
      const result = await deleteCategoryWithReplacement.mutateAsync({
        categoryId: deleteCategory.id,
        replacementCategoryId,
        userId,
      });
      
      if (result.migratedCount > 0) {
        toast.success(t('deleteSuccessWithMigration', { count: result.migratedCount }));
      } else {
        toast.success(t('deleteSuccess'));
      }
      
      setDeleteCategory(null);
    } catch (error) {
      toast.error(t('deleteError'));
      console.error('Failed to delete category:', error);
    }
  };

  // Get translated category name for system categories
  const getCategoryName = (cat: Category) => {
    if (cat.isSystem) {
      const iconToKey: Record<string, string> = {
        'utensils': 'food',
        'car': 'transportation',
        'shopping-bag': 'shopping',
        'film': 'entertainment',
        'receipt': 'bills',
        'heart-pulse': 'health',
        'plane': 'travel',
        'shopping-cart': 'groceries',
        'home': 'housing',
        'more-horizontal': 'other',
      };
      const key = iconToKey[cat.icon];
      return key ? tCategories(key) : cat.name;
    }
    return cat.name;
  };

  // Separate system and custom categories
  const systemCats = categories?.filter(c => c.isSystem) ?? [];
  const customCats = categories?.filter(c => !c.isSystem) ?? [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[700px] flex flex-col px-0 overflow-hidden">
          <SheetHeader className="px-4 sm:px-6 text-start">
            <SheetTitle>{t('title')}</SheetTitle>
            <SheetDescription>{t('description')}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4 overflow-y-auto">
            <div className="px-4 sm:px-6 pb-6 space-y-6 min-h-0">
              {/* Create new category */}
              {isCreating ? (
                <div className="space-y-4 p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/10 dark:bg-primary/5">
                  <h3 className="font-medium">{t('newCategory')}</h3>
                  
                  <div className="flex items-end gap-3">
                    <IconPicker
                      value={newIcon}
                      onChange={setNewIcon}
                      color={newColor}
                    />
                    <ColorPicker
                      value={newColor}
                      onChange={setNewColor}
                    />
                    <div className="flex-1">
                      <Label htmlFor="category-name" className="text-xs text-muted-foreground">
                        {t('categoryName')}
                      </Label>
                      <Input
                        id="category-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={t('namePlaceholder')}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false);
                        setNewName('');
                      }}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreate}
                      disabled={!newName.trim() || createCategory.isPending}
                    >
                      {createCategory.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                      ) : (
                        <Plus className="h-4 w-4 me-2" />
                      )}
                      {t('create')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 me-2" />
                  {t('addCategory')}
                </Button>
              )}

              {/* Custom categories */}
              {customCats.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    {t('customCategories')}
                  </h3>
                  <div className="space-y-2">
                    {customCats.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        displayName={getCategoryName(category)}
                        onDelete={() => handleDeleteClick(category)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <Separator />

              {/* System categories */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('systemCategories')}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('systemCategoriesNote')}
                </p>
                <div className="space-y-2">
                  {systemCats.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      displayName={getCategoryName(category)}
                      isSystem
                    />
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <DeleteCategoryDialog
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        category={deleteCategory}
        expenseCount={deleteExpenseCount}
        availableCategories={categories ?? []}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteCategoryWithReplacement.isPending}
      />
    </>
  );
}

// Category row component
interface CategoryRowProps {
  category: Category;
  displayName: string;
  isSystem?: boolean;
  onDelete?: () => void;
}

function CategoryRow({ category, displayName, isSystem, onDelete }: CategoryRowProps) {
  const Icon = getIconByName(category.icon);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border border-border',
        'bg-card',
        isSystem && 'opacity-80'
      )}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
        style={{ backgroundColor: `${category.color}25` }}
      >
        <Icon className="h-5 w-5" style={{ color: category.color }} />
      </span>
      <span className="flex-1 font-medium truncate">{displayName}</span>
      {!isSystem && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      {isSystem && (
        <Lock className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

