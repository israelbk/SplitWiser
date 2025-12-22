'use client';

/**
 * Category manager component
 * Allows users to view, create, delete, and reorder custom categories
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-current-user';
import {
  useUserCategories,
  useSystemCategories,
  useCreateCategory,
  useDeleteCategoryWithReplacement,
  useCategoryExpenseCount,
  useReorderCategories,
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
import { Plus, Trash2, Lock, Loader2, GripVertical } from 'lucide-react';
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
  const reorderCategories = useReorderCategories();

  // Form state for new category
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('utensils');
  const [newColor, setNewColor] = useState(AVAILABLE_COLORS[0]);

  // Delete dialog state
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [deleteExpenseCount, setDeleteExpenseCount] = useState(0);

  // Drag and drop state
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

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

  // Drag handlers for reordering
  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    setDraggedCategoryId(categoryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.4';
      }
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((categoryId: string) => {
    if (categoryId !== draggedCategoryId) {
      setDragOverCategoryId(categoryId);
    }
  }, [draggedCategoryId]);

  const handleDragLeave = useCallback(() => {
    setDragOverCategoryId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId || !userId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    // Find indices
    const draggedIndex = customCats.findIndex(c => c.id === draggedCategoryId);
    const targetIndex = customCats.findIndex(c => c.id === targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order
    const reorderedCats = [...customCats];
    const [removed] = reorderedCats.splice(draggedIndex, 1);
    reorderedCats.splice(targetIndex, 0, removed);

    // Calculate new sort orders (starting from 100 for custom categories)
    const categoryOrders = reorderedCats.map((cat, index) => ({
      id: cat.id,
      sortOrder: 100 + index,
    }));

    try {
      await reorderCategories.mutateAsync({ userId, categoryOrders });
    } catch (error) {
      toast.error(t('reorderError'));
      console.error('Failed to reorder categories:', error);
    }

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  }, [draggedCategoryId, customCats, userId, reorderCategories, t]);

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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('customCategories')}
                    </h3>
                    {customCats.length > 1 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        {t('reorderHint')}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {customCats.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        displayName={getCategoryName(category)}
                        onDelete={() => handleDeleteClick(category)}
                        draggable={customCats.length > 1}
                        isDragging={draggedCategoryId === category.id}
                        isDragOver={dragOverCategoryId === category.id}
                        onDragStart={(e) => handleDragStart(e, category.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id)}
                        dragNodeRef={draggedCategoryId === category.id ? dragNodeRef : undefined}
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
  // Drag and drop props
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  dragNodeRef?: React.RefObject<HTMLDivElement | null>;
}

function CategoryRow({ 
  category, 
  displayName, 
  isSystem, 
  onDelete,
  draggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  dragNodeRef,
}: CategoryRowProps) {
  const Icon = getIconByName(category.icon);

  return (
    <div
      ref={dragNodeRef}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border border-border',
        'bg-card transition-all duration-200',
        isSystem && 'opacity-80',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-95',
        isDragOver && 'border-primary border-2 bg-primary/5'
      )}
    >
      {/* Drag handle for custom categories - made prominent for discoverability */}
      {draggable && (
        <div className="flex items-center justify-center h-8 w-6 -ms-1 rounded hover:bg-muted/80 transition-colors">
          <GripVertical className="h-5 w-5 text-muted-foreground/70" />
        </div>
      )}
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

