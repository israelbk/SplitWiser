'use client';

/**
 * Group form component
 * Create/edit group dialog
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
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/queries';
import { useCurrentUser } from '@/hooks/use-current-user';
import { UserAvatar } from '@/components/common';
import { Group, GroupType } from '@/lib/types';
import { Loader2, Plane, Home, Heart, MoreHorizontal } from 'lucide-react';

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['trip', 'household', 'couple', 'other']),
  memberIds: z.array(z.string()).min(1, 'Select at least one member'),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GroupFormData) => void;
  group?: Partial<Group>;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

const groupTypes = [
  { value: 'trip', label: 'Trip', icon: Plane },
  { value: 'household', label: 'Household', icon: Home },
  { value: 'couple', label: 'Couple', icon: Heart },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export function GroupForm({
  open,
  onOpenChange,
  onSubmit,
  group,
  title = 'Create Group',
  description = 'Create a group to split expenses with friends.',
  isLoading = false,
}: GroupFormProps) {
  const { currentUser } = useCurrentUser();
  const { data: users } = useUsers();

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      type: (group?.type as GroupType) || 'trip',
      memberIds: currentUser ? [currentUser.id] : [],
    },
  });

  const selectedMemberIds = form.watch('memberIds');

  // Ensure current user is always included in memberIds when available
  useEffect(() => {
    if (currentUser && open) {
      const currentMemberIds = form.getValues('memberIds');
      if (!currentMemberIds.includes(currentUser.id)) {
        form.setValue('memberIds', [currentUser.id, ...currentMemberIds]);
      }
    }
  }, [currentUser, open, form]);

  const handleSubmit = (data: GroupFormData) => {
    onSubmit(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Reset form when opening or closing
    if (currentUser) {
      form.reset({
        name: group?.name || '',
        description: group?.description || '',
        type: (group?.type as GroupType) || 'trip',
        memberIds: [currentUser.id],
      });
    }
    onOpenChange(newOpen);
  };

  const toggleMember = (userId: string) => {
    const current = form.getValues('memberIds');
    if (current.includes(userId)) {
      // Don't allow removing the current user
      if (userId === currentUser?.id) return;
      form.setValue(
        'memberIds',
        current.filter((id) => id !== userId)
      );
    } else {
      form.setValue('memberIds', [...current, userId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="Summer Trip 2024"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Trip to Barcelona"
                {...form.register('description')}
              />
            </div>

            {/* Group Type */}
            <div className="space-y-2">
              <Label>Type</Label>
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
              <Label>Members</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {users?.map((user) => {
                  const isSelected = selectedMemberIds.includes(user.id);
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isCurrentUser}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <UserAvatar user={user} size="sm" />
                      <span className="flex-1 text-sm">
                        {user.name}
                        {isCurrentUser && (
                          <span className="text-muted-foreground ml-1">(you)</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              {form.formState.errors.memberIds && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.memberIds.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {group?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

