'use client';

/**
 * Member Picker Component
 * Allows selecting group members from:
 * 1. Existing contacts (users you've been in groups with)
 * 2. Adding new members by email (creates shadow users)
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { useContactableUsers, useGetOrCreateUserByEmail } from '@/hooks/queries';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  X, 
  Mail, 
  Users, 
  UserPlus, 
  Loader2,
  Ghost,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface MemberPickerProps {
  /** Current user (always included, cannot be removed) */
  currentUser: User;
  /** Currently selected member IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void;
  /** Optional: Already loaded members (for editing existing groups) */
  existingMembers?: User[];
  /** Show shadow user indicator */
  showShadowIndicator?: boolean;
}

export function MemberPicker({
  currentUser,
  selectedIds,
  onSelectionChange,
  existingMembers = [],
  showShadowIndicator = true,
}: MemberPickerProps) {
  const t = useTranslations('memberPicker');
  const tCommon = useTranslations('common');
  const [emailInput, setEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  
  // Get contacts (users the current user has been in groups with)
  const { data: contacts = [], isLoading: contactsLoading } = useContactableUsers(currentUser.id);
  
  // Mutation for creating/getting user by email
  const getOrCreateUser = useGetOrCreateUserByEmail();

  // Combine contacts with existing members and any newly added members
  const [addedMembers, setAddedMembers] = useState<User[]>([]);
  
  // All available members to show
  const availableMembers = useMemo(() => {
    const membersMap = new Map<string, User>();
    
    // Add current user first
    membersMap.set(currentUser.id, currentUser);
    
    // Add existing members (from editing)
    existingMembers.forEach(m => membersMap.set(m.id, m));
    
    // Add contacts
    contacts.forEach(m => membersMap.set(m.id, m));
    
    // Add newly added members
    addedMembers.forEach(m => membersMap.set(m.id, m));
    
    return Array.from(membersMap.values());
  }, [currentUser, existingMembers, contacts, addedMembers]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email is already in the list
  const isEmailInList = (email: string): boolean => {
    const normalizedEmail = email.toLowerCase();
    return availableMembers.some(m => m.email.toLowerCase() === normalizedEmail);
  };

  // Handle adding a new member by email
  const handleAddByEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    
    if (!email) {
      return;
    }
    
    if (!isValidEmail(email)) {
      toast.error(t('invalidEmail'));
      return;
    }
    
    if (isEmailInList(email)) {
      toast.error(t('emailAlreadyInList'));
      setEmailInput('');
      return;
    }
    
    setIsAddingEmail(true);
    
    try {
      const user = await getOrCreateUser.mutateAsync({
        email,
        invitedBy: currentUser.id,
      });
      
      // Add to local added members list
      setAddedMembers(prev => [...prev, user]);
      
      // Auto-select the new member
      if (!selectedIds.includes(user.id)) {
        onSelectionChange([...selectedIds, user.id]);
      }
      
      setEmailInput('');
      toast.success(
        user.isShadow 
          ? t('invitedSuccess', { email })
          : t('addedSuccess', { name: user.name })
      );
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error(t('failedToAdd'));
    } finally {
      setIsAddingEmail(false);
    }
  };

  // Handle toggling member selection
  const toggleMember = (userId: string) => {
    // Don't allow removing current user
    if (userId === currentUser.id) return;
    
    if (selectedIds.includes(userId)) {
      onSelectionChange(selectedIds.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedIds, userId]);
    }
  };

  // Handle key press in email input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddByEmail();
    }
  };

  // Selected members for display
  const selectedMembers = availableMembers.filter(m => selectedIds.includes(m.id));
  
  // Unselected contacts
  const unselectedContacts = availableMembers.filter(
    m => !selectedIds.includes(m.id) && m.id !== currentUser.id
  );

  return (
    <div className="space-y-4">
      {/* Email Input Section */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {t('addByEmail')}
        </Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t('emailPlaceholder')}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAddingEmail}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddByEmail}
            disabled={!emailInput.trim() || isAddingEmail}
            size="icon"
          >
            {isAddingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('emailHelp')}
        </p>
      </div>

      <Separator />

      {/* Selected Members */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          {t('selectedMembers')} ({selectedMembers.length})
        </Label>
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => {
            const isCurrentUser = member.id === currentUser.id;
            
            return (
              <Badge
                key={member.id}
                variant={isCurrentUser ? 'default' : 'secondary'}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-2",
                  !isCurrentUser && "cursor-pointer hover:bg-secondary/80"
                )}
                onClick={() => !isCurrentUser && toggleMember(member.id)}
              >
                <UserAvatar user={member} size="xs" />
                <span className="max-w-[120px] truncate">
                  {isCurrentUser ? tCommon('you') : member.name}
                </span>
                {showShadowIndicator && member.isShadow && (
                  <Ghost className="h-3 w-3 text-muted-foreground" />
                )}
                {!isCurrentUser && (
                  <X className="h-3 w-3 ms-1 opacity-60" />
                )}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Available Contacts */}
      {unselectedContacts.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('yourContacts')}
            </Label>
            {contactsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[200px] pe-4">
                <div className="space-y-1">
                  {unselectedContacts.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <UserAvatar user={member} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      {showShadowIndicator && member.isShadow && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Ghost className="h-3 w-3" />
                          {t('invited')}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {unselectedContacts.length === 0 && !contactsLoading && selectedMembers.length === 1 && (
        <div className="text-center py-6 text-muted-foreground">
          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('noContacts')}</p>
          <p className="text-xs">{t('addMembersAbove')}</p>
        </div>
      )}
    </div>
  );
}

