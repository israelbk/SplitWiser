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
  const [isDragCollapsed, setIsDragCollapsed] = useState(false); // Delayed collapse for drag image capture
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

  // All categories in unified list (already sorted by sort_order from repository)
  const allCategories = categories ?? [];

  // Drag handlers for reordering
  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    setDraggedCategoryId(categoryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
    // Delay the collapse to allow the drag image to be captured first
    setTimeout(() => {
      setIsDragCollapsed(true);
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
    setIsDragCollapsed(false);
  }, []);

  // Use onDragOver to set the target - more reliable than enter/leave
  const handleDragOver = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Set the drag over target on every dragOver event
    if (categoryId !== draggedCategoryId && dragOverCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId);
    }
  }, [draggedCategoryId, dragOverCategoryId]);

  // Only clear on drag leave if we're leaving the entire list area
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Check if we're leaving to outside the current target
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    
    // Only clear if we're truly leaving (not entering a child element)
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverCategoryId(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId || !userId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    // Find the dragged category and target index
    const draggedCategory = allCategories.find(c => c.id === draggedCategoryId);
    const draggedIndex = allCategories.findIndex(c => c.id === draggedCategoryId);
    const targetIndex = allCategories.findIndex(c => c.id === targetCategoryId);

    if (!draggedCategory || draggedIndex === -1 || targetIndex === -1) return;

    // Calculate new sortOrder using floating point average
    // This only updates the dragged item, not all items
    let newSortOrder: number;
    
    // Get the list without the dragged item to find correct neighbors
    const listWithoutDragged = allCategories.filter(c => c.id !== draggedCategoryId);
    const adjustedTargetIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
    
    if (adjustedTargetIndex === 0) {
      // Dropping at the top: average of 0 and first item
      const firstItem = listWithoutDragged[0];
      newSortOrder = firstItem.sortOrder / 2;
    } else {
      // Dropping in the middle: average of item above and target
      const itemAbove = listWithoutDragged[adjustedTargetIndex - 1];
      const targetItem = listWithoutDragged[adjustedTargetIndex];
      newSortOrder = (itemAbove.sortOrder + targetItem.sortOrder) / 2;
    }

    try {
      await reorderCategories.mutateAsync({ 
        userId, 
        categoryOrders: [{ id: draggedCategoryId, sortOrder: newSortOrder }]
      });
    } catch (error) {
      toast.error(t('reorderError'));
      console.error('Failed to reorder categories:', error);
    }

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  }, [draggedCategoryId, allCategories, userId, reorderCategories, t]);

  // Handle dropping at the bottom of the list
  const handleDropAtBottom = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedCategoryId || !userId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    // Get the list without the dragged item
    const listWithoutDragged = allCategories.filter(c => c.id !== draggedCategoryId);
    
    if (listWithoutDragged.length === 0) return;

    // New sortOrder = average of last item and 2x last item = 1.5 * last item
    const lastItem = listWithoutDragged[listWithoutDragged.length - 1];
    const newSortOrder = lastItem.sortOrder * 1.5;

    try {
      await reorderCategories.mutateAsync({ 
        userId, 
        categoryOrders: [{ id: draggedCategoryId, sortOrder: newSortOrder }]
      });
    } catch (error) {
      toast.error(t('reorderError'));
      console.error('Failed to reorder categories:', error);
    }

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  }, [draggedCategoryId, allCategories, userId, reorderCategories, t]);

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

              {/* All categories in unified list */}
              {allCategories.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('allCategories')}
                    </h3>
                    {allCategories.length > 1 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        {t('reorderHint')}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {allCategories.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        displayName={getCategoryName(category)}
                        onDelete={!category.isSystem ? () => handleDeleteClick(category) : undefined}
                        draggable={allCategories.length > 1}
                        isDragging={draggedCategoryId === category.id && isDragCollapsed}
                        isDragOver={dragOverCategoryId === category.id}
                        onDragStart={(e) => handleDragStart(e, category.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id)}
                        dragNodeRef={draggedCategoryId === category.id ? dragNodeRef : undefined}
                        isSystem={category.isSystem}
                      />
                    ))}
                    {/* Bottom drop zone for dragging to end of list */}
                    {draggedCategoryId && allCategories.length > 1 && (
                      <div
                        className={cn(
                          'h-16 rounded-xl border-2 border-dashed transition-all duration-200',
                          dragOverCategoryId === 'bottom'
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/30 bg-muted/30'
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverCategoryId !== 'bottom') {
                            setDragOverCategoryId('bottom');
                          }
                        }}
                        onDragLeave={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          const currentTarget = e.currentTarget as HTMLElement;
                          if (!currentTarget.contains(relatedTarget)) {
                            setDragOverCategoryId(null);
                          }
                        }}
                        onDrop={handleDropAtBottom}
                      />
                    )}
                  </div>
                </section>
              )}
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
  onDragLeave?: (e: React.DragEvent) => void;
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
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'relative transition-all duration-200 ease-out',
        isDragOver && 'pt-[72px]', // Open space equal to item height for natural drop zone
        isDragging && 'hidden' // Fully hide to preserve natural spacing from space-y-2
      )}
    >
      {/* Drop zone indicator - ghost of where item will land */}
      {isDragOver && (
        <div className="absolute top-0 left-0 right-0 h-[68px] flex items-center px-2">
          <div className="w-full h-full rounded-xl border-2 border-dashed border-primary/50 bg-primary/5" />
        </div>
      )}
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border border-border',
          'bg-card transition-all duration-200',
          isSystem && 'opacity-80',
          draggable && 'cursor-grab active:cursor-grabbing',
          isDragOver && 'border-primary/50'
        )}
      >
        {/* Drag handle - made prominent for discoverability */}
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
    </div>
  );
}

