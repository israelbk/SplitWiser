/**
 * Available icons for category selection
 * All icons are from Lucide React to maintain design consistency
 */

import {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  Plane,
  ShoppingCart,
  Home,
  MoreHorizontal,
  Coffee,
  Beer,
  Wine,
  Pizza,
  Cake,
  Apple,
  Carrot,
  Fuel,
  Bus,
  Train,
  Bike,
  Gamepad2,
  Music,
  Tv,
  Camera,
  Book,
  GraduationCap,
  Briefcase,
  Laptop,
  Smartphone,
  Watch,
  Gift,
  PartyPopper,
  Baby,
  Dog,
  Cat,
  Dumbbell,
  Pill,
  Stethoscope,
  Scissors,
  Sparkles,
  Palette,
  Wrench,
  Hammer,
  Lightbulb,
  Wifi,
  CreditCard,
  Wallet,
  PiggyBank,
  Banknote,
  CircleDollarSign,
  Landmark,
  Building2,
  TreePine,
  Mountain,
  Umbrella,
  Sun,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon definition with name and component
 */
export interface IconDefinition {
  name: string;
  icon: LucideIcon;
  category: IconCategory;
}

/**
 * Categories for organizing icons in the picker
 */
export type IconCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'home'
  | 'finance'
  | 'travel'
  | 'other';

/**
 * Available icons for category selection
 * Organized by type for easier browsing
 */
export const AVAILABLE_ICONS: IconDefinition[] = [
  // Food & Dining
  { name: 'utensils', icon: Utensils, category: 'food' },
  { name: 'coffee', icon: Coffee, category: 'food' },
  { name: 'beer', icon: Beer, category: 'food' },
  { name: 'wine', icon: Wine, category: 'food' },
  { name: 'pizza', icon: Pizza, category: 'food' },
  { name: 'cake', icon: Cake, category: 'food' },
  { name: 'apple', icon: Apple, category: 'food' },
  { name: 'carrot', icon: Carrot, category: 'food' },

  // Transport
  { name: 'car', icon: Car, category: 'transport' },
  { name: 'fuel', icon: Fuel, category: 'transport' },
  { name: 'bus', icon: Bus, category: 'transport' },
  { name: 'train', icon: Train, category: 'transport' },
  { name: 'bike', icon: Bike, category: 'transport' },
  { name: 'plane', icon: Plane, category: 'transport' },

  // Entertainment
  { name: 'film', icon: Film, category: 'entertainment' },
  { name: 'gamepad-2', icon: Gamepad2, category: 'entertainment' },
  { name: 'music', icon: Music, category: 'entertainment' },
  { name: 'tv', icon: Tv, category: 'entertainment' },
  { name: 'camera', icon: Camera, category: 'entertainment' },
  { name: 'book', icon: Book, category: 'entertainment' },
  { name: 'party-popper', icon: PartyPopper, category: 'entertainment' },

  // Shopping
  { name: 'shopping-bag', icon: ShoppingBag, category: 'shopping' },
  { name: 'shopping-cart', icon: ShoppingCart, category: 'shopping' },
  { name: 'gift', icon: Gift, category: 'shopping' },
  { name: 'watch', icon: Watch, category: 'shopping' },

  // Health & Personal
  { name: 'heart-pulse', icon: HeartPulse, category: 'health' },
  { name: 'pill', icon: Pill, category: 'health' },
  { name: 'stethoscope', icon: Stethoscope, category: 'health' },
  { name: 'dumbbell', icon: Dumbbell, category: 'health' },
  { name: 'scissors', icon: Scissors, category: 'health' },
  { name: 'sparkles', icon: Sparkles, category: 'health' },

  // Home & Utilities
  { name: 'home', icon: Home, category: 'home' },
  { name: 'lightbulb', icon: Lightbulb, category: 'home' },
  { name: 'wifi', icon: Wifi, category: 'home' },
  { name: 'wrench', icon: Wrench, category: 'home' },
  { name: 'hammer', icon: Hammer, category: 'home' },

  // Finance & Work
  { name: 'receipt', icon: Receipt, category: 'finance' },
  { name: 'credit-card', icon: CreditCard, category: 'finance' },
  { name: 'wallet', icon: Wallet, category: 'finance' },
  { name: 'piggy-bank', icon: PiggyBank, category: 'finance' },
  { name: 'banknote', icon: Banknote, category: 'finance' },
  { name: 'circle-dollar-sign', icon: CircleDollarSign, category: 'finance' },
  { name: 'landmark', icon: Landmark, category: 'finance' },
  { name: 'briefcase', icon: Briefcase, category: 'finance' },
  { name: 'laptop', icon: Laptop, category: 'finance' },
  { name: 'smartphone', icon: Smartphone, category: 'finance' },
  { name: 'graduation-cap', icon: GraduationCap, category: 'finance' },

  // Travel & Outdoors
  { name: 'building-2', icon: Building2, category: 'travel' },
  { name: 'tree-pine', icon: TreePine, category: 'travel' },
  { name: 'mountain', icon: Mountain, category: 'travel' },
  { name: 'umbrella', icon: Umbrella, category: 'travel' },
  { name: 'sun', icon: Sun, category: 'travel' },

  // Other
  { name: 'baby', icon: Baby, category: 'other' },
  { name: 'dog', icon: Dog, category: 'other' },
  { name: 'cat', icon: Cat, category: 'other' },
  { name: 'palette', icon: Palette, category: 'other' },
  { name: 'more-horizontal', icon: MoreHorizontal, category: 'other' },
];

/**
 * Map of icon names to Lucide icon components
 * Used for rendering icons by name string
 */
export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  AVAILABLE_ICONS.map((def) => [def.name, def.icon])
);

/**
 * Get icon component by name
 */
export function getIconByName(name: string): LucideIcon {
  return ICON_MAP[name] || MoreHorizontal;
}

/**
 * Available colors for category selection
 * Includes system category colors + additional options
 */
export const AVAILABLE_COLORS = [
  // System category colors
  '#f97316', // Orange (Food)
  '#3b82f6', // Blue (Transport)
  '#a855f7', // Purple (Entertainment)
  '#ec4899', // Pink (Shopping)
  '#64748b', // Slate (Bills)
  '#ef4444', // Red (Health)
  '#06b6d4', // Cyan (Travel)
  '#22c55e', // Green (Groceries)
  '#8b5cf6', // Violet (Housing)
  '#6b7280', // Gray (Other)
  // Additional colors
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#78716c', // Stone
];

/**
 * Icon category labels for grouping in picker
 */
export const ICON_CATEGORY_LABELS: Record<IconCategory, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  health: 'Health & Personal',
  home: 'Home & Utilities',
  finance: 'Finance & Work',
  travel: 'Travel & Outdoors',
  other: 'Other',
};

