export type Category = 'CENA' | 'APERITIVO' | 'SPORT';
export type FilterCategory = 'TUTTI' | Category;
export type BookingStatus = 'OPEN' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
export type View = 'home' | 'explore' | 'my-events' | 'group-detail' | 'notifications' | 'profile' | 'business';
export type MyEventsTab = 'JOINED' | 'CREATED' | 'SAVED';
export type EventSort = 'DATE' | 'QUORUM' | 'AVAILABILITY';
export type UserRole = 'USER' | 'VENUE' | 'ADMIN';
export type Sheet =
  | 'ONBOARDING'
  | 'EDIT_PROFILE'
  | 'PRIVACY'
  | 'NOTIFICATIONS'
  | 'RULES'
  | 'REPORT'
  | 'MEMBER_ACTIONS'
  | 'EDIT_EVENT'
  | null;

export interface Member {
  id: string;
  name: string;
  age: number;
  avatar: string;
  instagram?: string;
  verified?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  zone: string;
  priceRange: '€' | '€€' | '€€€';
  desc: string;
  customOrderNote: string;
  categories: Category[];
  sports?: string[];
  rating?: number;
  eventsHosted?: number;
  clientsBrought?: number;
  revenueGenerated?: number;
}

export interface Message {
  id: string;
  senderId: string;
  sender: string;
  text: string;
  time: string;
}

export interface Group {
  id: string;
  creatorId: string;
  category: Category;
  sport?: string;
  name: string;
  description: string;
  vibe: string;
  ageRange: string;
  minCapacity: number;
  capacity: number;
  members: Member[];
  bookingStatus: BookingStatus;
  selectedVenue: Venue;
  selectedDate: string;
  code: string;
  checkedInUserIds: string[];
  messages: Message[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: string;
  groupId?: string;
}

export interface AppUser {
  id: string;
  name: string;
  age: number | null;
  city: string;
  avatar: string;
  interests: string[];
  email: string;
  instagram: string;
  verified: boolean;
  role: UserRole;
}

export interface CreateDraft {
  category: Category;
  sport: string;
  name: string;
  date: string;
  description: string;
  vibe: string;
  ageRange: string;
  venueId: string;
  minCapacity: number;
  capacity: number;
}

export interface AppPreferences {
  pushEventUpdates: boolean;
  pushChat: boolean;
  pushSuggestions: boolean;
  showInstagramAfterConfirm: boolean;
  showAge: boolean;
}

export interface ReportDraft {
  targetUserId?: string;
  targetGroupId?: string;
  reason: string;
  note: string;
}

export interface PendingAction {
  type: 'JOIN' | 'CREATE';
  groupId?: string;
}
