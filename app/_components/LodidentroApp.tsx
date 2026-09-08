'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  ADMIN_STATS,
  CATEGORY_META,
  DEFAULT_PREFERENCES,
  GUEST_USER,
  INITIAL_DRAFT,
  INITIAL_GROUPS,
  INTEREST_OPTIONS,
  VENUES,
} from './lodidentro/data';
import type {
  AppNotification,
  AppPreferences,
  AppUser,
  Category,
  CreateDraft,
  EventSort,
  FilterCategory,
  Group,
  Member,
  MyEventsTab,
  PendingAction,
  ReportDraft,
  Sheet,
  UserRole,
  View,
} from './lodidentro/types';
import {
  canCheckInNow,
  cn,
  effectiveStatus,
  eventShareUrl,
  formatEuro,
  formatEventDate,
  getGroupStatus,
  isUserInGroup,
  normalizeInstagram,
  randomCode,
  safeParse,
  toLocalDateTimeInput,
} from './lodidentro/utils';

const STORAGE = {
  groups: 'lodidentro:v4:groups',
  profile: (userId: string) => `lodidentro:v4:profile:${userId}`,
  profileCompleted: (userId: string) => `lodidentro:v4:profile-completed:${userId}`,
  notifications: (userId: string) => `lodidentro:v4:notifications:${userId}`,
  favorites: (userId: string) => `lodidentro:v4:favorites:${userId}`,
  preferences: (userId: string) => `lodidentro:v4:preferences:${userId}`,
  blocked: (userId: string) => `lodidentro:v4:blocked:${userId}`,
  reports: 'lodidentro:v4:reports',
};

function avatarFallback(name: string) {
  const value = name.trim() || 'L';
  return value.slice(0, 1).toUpperCase();
}

function Avatar({ member, size = 'md' }: { member: Pick<Member, 'name' | 'avatar'>; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const sizes = size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-10 w-10 text-xs';

  if (!member.avatar || failed) {
    return (
      <span className={cn('grid shrink-0 place-items-center rounded-full bg-slate-200 font-black text-slate-600', sizes)} aria-hidden="true">
        {avatarFallback(member.name)}
      </span>
    );
  }

  return (
    <img
      src={member.avatar}
      alt={member.name}
      className={cn('shrink-0 rounded-full object-cover', sizes)}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  );
}

function AvatarStack({ members, max = 4 }: { members: Member[]; max?: number }) {
  const visible = members.slice(0, max);
  const hidden = Math.max(members.length - max, 0);
  return (
    <div className="flex items-center" aria-label={`${members.length} partecipanti`}>
      <div className="flex -space-x-2">
        {visible.map((member) => (
          <span key={member.id} className="rounded-full border-2 border-white">
            <Avatar member={member} size="sm" />
          </span>
        ))}
      </div>
      {hidden > 0 && <span className="ml-2 text-[11px] font-bold text-slate-500">+{hidden}</span>}
    </div>
  );
}

function ProgressBar({ group }: { group: Group }) {
  const denominator = Math.max(group.minCapacity, 1);
  const value = Math.min((group.members.length / denominator) * 100, 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-500">Quorum</span>
        <span className="font-extrabold text-slate-700">{group.members.length}/{group.minCapacity}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Avanzamento quorum" aria-valuemin={0} aria-valuemax={group.minCapacity} aria-valuenow={Math.min(group.members.length, group.minCapacity)}>
        <div className="h-full rounded-full bg-[#E63946] transition-all duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function EventCard({
  group,
  currentUserId,
  favorite,
  onOpen,
  onFavorite,
}: {
  group: Group;
  currentUserId: string;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}) {
  const status = getGroupStatus(group);
  const joined = isUserInGroup(group, currentUserId);
  const full = group.members.length >= group.capacity;
  const meta = CATEGORY_META[group.category];
  const closed = ['CANCELLED', 'COMPLETED'].includes(effectiveStatus(group));

  return (
    <article className="relative rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <button
        type="button"
        onClick={onFavorite}
        className={cn('absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border bg-white shadow-sm transition', favorite ? 'border-red-100 text-[#E63946]' : 'border-slate-100 text-slate-400 hover:text-[#E63946]')}
        aria-label={favorite ? 'Rimuovi dai salvati' : 'Salva evento'}
      >
        <i className={cn(favorite ? 'fa-solid' : 'fa-regular', 'fa-bookmark text-xs')} aria-hidden="true" />
      </button>

      <button type="button" onClick={onOpen} className="w-full pr-11 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide', meta.soft, meta.accent)}>
            <i className={cn('fa-solid', meta.icon)} aria-hidden="true" />
            {group.sport ?? meta.label}
          </span>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold', status.tone)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[16px] font-black leading-tight text-slate-950">{group.name}</h3>
        <div className="mt-3 grid gap-2 text-[12px] text-slate-600">
          <span className="flex min-w-0 items-center gap-2"><i className="fa-regular fa-calendar w-4 text-center text-slate-400" aria-hidden="true" /><span className="truncate font-semibold">{formatEventDate(group.selectedDate)}</span></span>
          <span className="flex min-w-0 items-center gap-2"><i className="fa-solid fa-location-dot w-4 text-center text-slate-400" aria-hidden="true" /><span className="truncate">{group.selectedVenue.name}</span></span>
        </div>
        <div className="mt-4"><ProgressBar group={group} /></div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <AvatarStack members={group.members} />
            <span className="text-[10px] text-slate-500">{Math.max(group.capacity - group.members.length, 0)} posti liberi</span>
          </div>
          <span className={cn('rounded-xl px-3 py-2 text-[10px] font-extrabold', joined ? 'bg-slate-950 text-white' : full || closed ? 'bg-slate-100 text-slate-400' : 'bg-[#E63946] text-white')}>
            {joined ? 'Apri' : closed ? 'Vedi' : full ? 'Completo' : 'Scopri'}
          </span>
        </div>
      </button>
    </article>
  );
}

function EmptyState({ icon, title, description, action }: { icon: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-7 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><i className={cn('fa-solid', icon)} aria-hidden="true" /></div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-4 py-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-900">{label}</span>
        {description && <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{description}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-[#E63946]' : 'bg-slate-200')} aria-hidden="true">
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-6' : 'left-1')} />
      </span>
    </button>
  );
}

function SheetFrame({ title, eyebrow, onClose, children }: { title: string; eyebrow?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm md:items-center md:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" className="max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[32px] sm:max-w-[560px] bg-white shadow-2xl md:rounded-[32px]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur-xl">
          <div>{eyebrow && <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">{eyebrow}</p>}<h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Chiudi"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
        </header>
        <div className="px-5 py-5">{children}</div>
      </section>
    </div>
  );
}

function ClerkLoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#0f172a] px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#E63946]" /><span className="text-sm font-extrabold text-slate-700">Sto preparando Lodidentro…</span></div>
    </div>
  );
}

function getStringMetadata(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getNumberMetadata(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getStringArrayMetadata(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function getRole(value: unknown): UserRole {
  return value === 'ADMIN' || value === 'VENUE' ? value : 'USER';
}


export default function LodidentroApp() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return <ClerkLoadingScreen />;

  const signedIn = Boolean(isSignedIn && user);
  let initialUser = GUEST_USER;

  if (signedIn && user) {
    const unsafe = user.unsafeMetadata ?? {};
    const pub = user.publicMetadata ?? {};
    const firstName = user.firstName || user.fullName?.split(' ')[0] || 'Utente';
    const fullName = getStringMetadata(unsafe.displayName) || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || firstName;
    initialUser = {
      id: user.id,
      name: fullName,
      age: getNumberMetadata(unsafe.age),
      city: getStringMetadata(unsafe.city),
      avatar: user.imageUrl,
      interests: getStringArrayMetadata(unsafe.interests),
      email: user.primaryEmailAddress?.emailAddress ?? '',
      instagram: normalizeInstagram(getStringMetadata(unsafe.instagram)),
      verified: user.primaryEmailAddress?.verification?.status === 'verified',
      role: getRole(pub.role),
    };
  }

  return <LodidentroShell key={signedIn ? initialUser.id : 'guest'} initialUser={initialUser} isSignedIn={signedIn} />;
}

function LodidentroShell({ initialUser, isSignedIn }: { initialUser: AppUser; isSignedIn: boolean }) {
  const router = useRouter();
  const mainRef = useRef<HTMLElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [appUser, setAppUser] = useState<AppUser>(initialUser);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(INITIAL_GROUPS[0]?.id ?? null);
  const [exploreFilter, setExploreFilter] = useState<FilterCategory>('TUTTI');
  const [eventSort, setEventSort] = useState<EventSort>('DATE');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [myEventsTab, setMyEventsTab] = useState<MyEventsTab>('JOINED');
  const [chatText, setChatText] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createError, setCreateError] = useState('');
  const [createDraft, setCreateDraft] = useState<CreateDraft>(INITIAL_DRAFT);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [reportDraft, setReportDraft] = useState<ReportDraft>({ reason: 'Comportamento inappropriato', note: '' });
  const [profileDraft, setProfileDraft] = useState<AppUser>(initialUser);
  const [editEventDraft, setEditEventDraft] = useState<CreateDraft>(INITIAL_DRAFT);
  const [toast, setToast] = useState<string | null>(null);

  const storageUserId = isSignedIn ? initialUser.id : 'guest';
  const canAccessBusiness = appUser.role === 'ADMIN';

  useEffect(() => {
    const loadedGroups = safeParse<Group[]>(window.localStorage.getItem(STORAGE.groups), INITIAL_GROUPS);
    let effectiveGroups = Array.isArray(loadedGroups) && loadedGroups.length ? loadedGroups : INITIAL_GROUPS;
    const loadedFavorites = safeParse<string[]>(window.localStorage.getItem(STORAGE.favorites(storageUserId)), []);
    setFavorites(loadedFavorites);

    let completedProfile = false;
    let loadedProfile = initialUser;

    if (isSignedIn) {
      const savedProfile = safeParse<AppUser | null>(window.localStorage.getItem(STORAGE.profile(storageUserId)), null);
      const savedPreferences = safeParse<AppPreferences>(window.localStorage.getItem(STORAGE.preferences(storageUserId)), DEFAULT_PREFERENCES);
      const savedBlocked = safeParse<string[]>(window.localStorage.getItem(STORAGE.blocked(storageUserId)), []);
      const savedNotifications = safeParse<AppNotification[]>(window.localStorage.getItem(STORAGE.notifications(storageUserId)), []);
      completedProfile = window.localStorage.getItem(STORAGE.profileCompleted(storageUserId)) === '1' || Boolean(initialUser.age && initialUser.city && initialUser.interests.length);
      loadedProfile = savedProfile ? { ...initialUser, ...savedProfile, id: initialUser.id, email: initialUser.email, avatar: initialUser.avatar || savedProfile.avatar, verified: initialUser.verified, role: initialUser.role } : initialUser;
      setAppUser(loadedProfile);
      setProfileDraft(loadedProfile);
      setProfileCompleted(completedProfile);
      setPreferences(savedPreferences);
      setBlockedUserIds(savedBlocked);
      setNotifications(savedNotifications.length ? savedNotifications : [{ id: 'welcome', title: 'Benvenuto su Lodidentro', description: 'Esplora gli eventi e completa il profilo quando vuoi partecipare.', time: 'Adesso', read: false, icon: 'fa-heart' }]);
    } else {
      setAppUser(GUEST_USER);
      setProfileDraft(GUEST_USER);
      setProfileCompleted(false);
      setPreferences(DEFAULT_PREFERENCES);
      setBlockedUserIds([]);
      setNotifications([]);
    }

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    const action = params.get('action');
    if (eventId && effectiveGroups.some((group) => group.id === eventId)) {
      setSelectedGroupId(eventId);
      setPreviousView('explore');
      setCurrentView('group-detail');
    }
    if (isSignedIn && action === 'join' && eventId) {
      const target = effectiveGroups.find((group) => group.id === eventId);
      if (target && completedProfile && loadedProfile.age && !isUserInGroup(target, loadedProfile.id) && target.members.length < target.capacity && ['OPEN', 'BOOKED'].includes(effectiveStatus(target))) {
        const member: Member = { id: loadedProfile.id, name: loadedProfile.name.split(' ')[0], age: loadedProfile.age, avatar: loadedProfile.avatar, instagram: loadedProfile.instagram || undefined, verified: loadedProfile.verified };
        effectiveGroups = effectiveGroups.map((group) => {
          if (group.id !== eventId) return group;
          const members = [...group.members, member];
          return { ...group, members, bookingStatus: group.bookingStatus === 'OPEN' && members.length >= group.minCapacity ? 'BOOKED' : group.bookingStatus, messages: [...group.messages, { id: `system_join_${Date.now()}`, senderId: 'system', sender: 'Lodidentro', text: `${member.name} si è unito al gruppo.`, time: 'Adesso' }] };
        });
        setToast('Accesso riuscito: posto confermato nel gruppo.');
      } else if (target && !completedProfile) {
        setPendingAction({ type: 'JOIN', groupId: eventId });
        setProfileDraft(loadedProfile);
        setSheet('ONBOARDING');
      }
    }
    if (isSignedIn && action === 'create') {
      if (completedProfile) {
        setCreateStep(1);
        setCreateError('');
        setCreateDraft(INITIAL_DRAFT);
        setCreateOpen(true);
      } else {
        setPendingAction({ type: 'CREATE' });
        setProfileDraft(loadedProfile);
        setSheet('ONBOARDING');
      }
    }
    setGroups(effectiveGroups);
    setHydrated(true);
  }, [isSignedIn, storageUserId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.groups, JSON.stringify(groups));
  }, [groups, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.favorites(storageUserId), JSON.stringify(favorites));
  }, [favorites, hydrated, storageUserId]);

  useEffect(() => {
    if (!hydrated || !isSignedIn) return;
    window.localStorage.setItem(STORAGE.profile(storageUserId), JSON.stringify(appUser));
    window.localStorage.setItem(STORAGE.profileCompleted(storageUserId), profileCompleted ? '1' : '0');
    window.localStorage.setItem(STORAGE.preferences(storageUserId), JSON.stringify(preferences));
    window.localStorage.setItem(STORAGE.blocked(storageUserId), JSON.stringify(blockedUserIds));
    window.localStorage.setItem(STORAGE.notifications(storageUserId), JSON.stringify(notifications));
  }, [appUser, blockedUserIds, hydrated, isSignedIn, notifications, preferences, profileCompleted, storageUserId]);

  useEffect(() => {
    const anyModal = Boolean(sheet || createOpen);
    if (!anyModal) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSheet(null);
        setCreateOpen(false);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheet, createOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) ?? null, [groups, selectedGroupId]);
  const availableVenues = useMemo(() => VENUES.filter((venue) => venue.categories.includes(createDraft.category) && (createDraft.category !== 'SPORT' || !venue.sports || venue.sports.includes(createDraft.sport))), [createDraft.category, createDraft.sport]);
  const editAvailableVenues = useMemo(() => VENUES.filter((venue) => venue.categories.includes(editEventDraft.category) && (editEventDraft.category !== 'SPORT' || !venue.sports || venue.sports.includes(editEventDraft.sport))), [editEventDraft.category, editEventDraft.sport]);

  useEffect(() => {
    if (availableVenues.some((venue) => venue.id === createDraft.venueId)) return;
    setCreateDraft((draft) => ({ ...draft, venueId: availableVenues[0]?.id ?? '' }));
  }, [availableVenues, createDraft.venueId]);

  const activeGroups = useMemo(() => groups.filter((group) => !['CANCELLED', 'COMPLETED'].includes(effectiveStatus(group))), [groups]);
  const joinedGroups = useMemo(() => groups.filter((group) => isUserInGroup(group, appUser.id)), [groups, appUser.id]);
  const createdGroups = useMemo(() => groups.filter((group) => group.creatorId === appUser.id), [groups, appUser.id]);
  const savedGroups = useMemo(() => groups.filter((group) => favorites.includes(group.id)), [groups, favorites]);
  const myGroups = myEventsTab === 'CREATED' ? createdGroups : myEventsTab === 'SAVED' ? savedGroups : joinedGroups;

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = activeGroups
      .filter((group) => exploreFilter === 'TUTTI' || group.category === exploreFilter)
      .filter((group) => !onlyAvailable || group.members.length < group.capacity)
      .filter((group) => {
        if (!query) return true;
        return [group.name, group.description, group.sport ?? '', group.selectedVenue.name, group.selectedVenue.zone, group.vibe].join(' ').toLowerCase().includes(query);
      });

    return [...result].sort((a, b) => {
      if (eventSort === 'QUORUM') return (a.minCapacity - a.members.length) - (b.minCapacity - b.members.length);
      if (eventSort === 'AVAILABILITY') return (b.capacity - b.members.length) - (a.capacity - a.members.length);
      return new Date(a.selectedDate).getTime() - new Date(b.selectedDate).getTime();
    });
  }, [activeGroups, eventSort, exploreFilter, onlyAvailable, searchQuery]);

  const unreadCount = isSignedIn ? notifications.filter((notification) => !notification.read).length : 0;

  const scrollTop = () => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const requestSignIn = (redirectTarget = '/') => router.push(`/access?redirect_url=${encodeURIComponent(redirectTarget)}`);

  const navigate = (view: View) => {
    const privateViews: View[] = ['my-events', 'notifications', 'profile', 'business'];
    if (!isSignedIn && privateViews.includes(view)) {
      requestSignIn('/');
      return;
    }
    if (view === 'business' && !canAccessBusiness) {
      setToast('Questa area è riservata agli amministratori Lodidentro.');
      return;
    }
    if (view !== 'group-detail') setPreviousView(currentView);
    setCurrentView(view);
    scrollTop();
  };

  const openGroup = (groupId: string, fromView: View = currentView) => {
    setPreviousView(fromView);
    setSelectedGroupId(groupId);
    setCurrentView('group-detail');
    setChatText('');
    scrollTop();
  };

  const openExplore = (filter: FilterCategory = 'TUTTI') => {
    setExploreFilter(filter);
    setSearchQuery('');
    setCurrentView('explore');
    scrollTop();
  };

  const updateGroup = (groupId: string, updater: (group: Group) => Group) => setGroups((items) => items.map((group) => group.id === groupId ? updater(group) : group));

  const addNotification = (title: string, description: string, icon: string, groupId?: string) => {
    if (!isSignedIn || !preferences.pushEventUpdates) return;
    setNotifications((items) => [{ id: `notification_${Date.now()}_${Math.random()}`, title, description, time: 'Adesso', read: false, icon, groupId }, ...items]);
  };

  const toggleFavorite = (groupId: string) => {
    setFavorites((items) => items.includes(groupId) ? items.filter((id) => id !== groupId) : [...items, groupId]);
    setToast(favorites.includes(groupId) ? 'Rimosso dai salvati.' : 'Evento salvato.');
  };

  const startOnboarding = (action?: PendingAction) => {
    setPendingAction(action ?? null);
    setProfileDraft(appUser);
    setSheet('ONBOARDING');
  };

  const ensureProfile = (action: PendingAction) => {
    if (profileCompleted && appUser.age && appUser.city) return true;
    startOnboarding(action);
    return false;
  };

  const joinGroupInternal = (group: Group) => {
    if (isUserInGroup(group, appUser.id)) return;
    if (effectiveStatus(group) !== 'OPEN' && effectiveStatus(group) !== 'BOOKED') {
      setToast('Questo evento non accetta più iscrizioni.');
      return;
    }
    if (group.members.length >= group.capacity) {
      setToast('Questo evento è già completo.');
      return;
    }
    if (!appUser.age) return;

    const member: Member = { id: appUser.id, name: appUser.name.split(' ')[0], age: appUser.age, avatar: appUser.avatar, instagram: appUser.instagram || undefined, verified: appUser.verified };
    let reachedQuorum = false;
    updateGroup(group.id, (current) => {
      const members = [...current.members, member];
      reachedQuorum = current.bookingStatus === 'OPEN' && members.length >= current.minCapacity;
      return {
        ...current,
        members,
        bookingStatus: reachedQuorum ? 'BOOKED' : current.bookingStatus,
        messages: [...current.messages, { id: `system_join_${Date.now()}`, senderId: 'system', sender: 'Lodidentro', text: `${member.name} si è unito al gruppo.`, time: 'Adesso' }],
      };
    });
    addNotification('Posto confermato', `${group.name} · ${formatEventDate(group.selectedDate)}`, 'fa-user-plus', group.id);
    if (reachedQuorum) addNotification('Quorum raggiunto!', `${group.name} è ora confermato.`, 'fa-circle-check', group.id);
    setToast(reachedQuorum ? 'Sei dentro: quorum raggiunto!' : 'Sei dentro al gruppo.');
  };

  const joinGroup = (group: Group) => {
    if (!isSignedIn) {
      requestSignIn(`/?event=${group.id}&action=join`);
      return;
    }
    if (!ensureProfile({ type: 'JOIN', groupId: group.id })) return;
    joinGroupInternal(group);
  };

  const leaveGroup = (group: Group) => {
    if (group.creatorId === appUser.id) {
      setToast('Se hai creato l’evento, puoi annullarlo ma non abbandonarlo.');
      return;
    }
    if (!window.confirm(`Vuoi davvero lasciare “${group.name}”? Il tuo posto verrà liberato.`)) return;
    updateGroup(group.id, (current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== appUser.id),
      checkedInUserIds: current.checkedInUserIds.filter((id) => id !== appUser.id),
      messages: [...current.messages, { id: `system_leave_${Date.now()}`, senderId: 'system', sender: 'Lodidentro', text: `${appUser.name.split(' ')[0]} ha lasciato il gruppo.`, time: 'Adesso' }],
    }));
    addNotification('Hai lasciato l’evento', group.name, 'fa-person-walking-arrow-right', group.id);
    setToast('Posto liberato correttamente.');
  };

  const cancelGroup = (group: Group) => {
    if (group.creatorId !== appUser.id) return;
    if (!window.confirm(`Annullare “${group.name}”? I partecipanti vedranno l’evento come annullato.`)) return;
    updateGroup(group.id, (current) => ({ ...current, bookingStatus: 'CANCELLED', messages: [...current.messages, { id: `system_cancel_${Date.now()}`, senderId: 'system', sender: 'Lodidentro', text: 'L’evento è stato annullato dall’organizzatore.', time: 'Adesso' }] }));
    addNotification('Evento annullato', group.name, 'fa-ban', group.id);
    setToast('Evento annullato.');
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = chatText.trim();
    if (!selectedGroup || !text || !isUserInGroup(selectedGroup, appUser.id) || effectiveStatus(selectedGroup) === 'CANCELLED') return;
    updateGroup(selectedGroup.id, (group) => ({ ...group, messages: [...group.messages, { id: `message_${Date.now()}`, senderId: appUser.id, sender: appUser.name.split(' ')[0], text, time: 'Adesso' }] }));
    setChatText('');
  };

  const handleCheckIn = (group: Group) => {
    if (!isUserInGroup(group, appUser.id)) return;
    if (!canCheckInNow(group)) {
      setToast('Il check-in si apre 4 ore prima dell’evento.');
      return;
    }
    updateGroup(group.id, (current) => ({ ...current, checkedInUserIds: current.checkedInUserIds.includes(appUser.id) ? current.checkedInUserIds : [...current.checkedInUserIds, appUser.id] }));
    addNotification('Check-in completato', group.name, 'fa-location-check', group.id);
    setToast('Check-in effettuato. Buon evento!');
  };

  const shareGroup = async (group: Group) => {
    const url = eventShareUrl(group.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: group.name, text: `Guarda questo evento su Lodidentro: ${group.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast('Link evento copiato.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setToast('Link evento copiato.');
      } catch {
        setToast('Non sono riuscito a copiare il link.');
      }
    }
  };

  const openCreateInternal = () => {
    setCreateStep(1);
    setCreateError('');
    setCreateDraft(INITIAL_DRAFT);
    setCreateOpen(true);
  };

  const openCreate = () => {
    if (!isSignedIn) {
      requestSignIn('/?action=create');
      return;
    }
    if (!ensureProfile({ type: 'CREATE' })) return;
    openCreateInternal();
  };

  const validateDraft = (draft: CreateDraft) => {
    if (draft.name.trim().length < 4) return 'Inserisci un titolo di almeno 4 caratteri.';
    if (!draft.date) return 'Scegli data e orario dell’evento.';
    const eventTime = new Date(draft.date).getTime();
    if (!Number.isFinite(eventTime) || eventTime < Date.now() + 30 * 60 * 1000) return 'Scegli un orario futuro, almeno 30 minuti da adesso.';
    if (draft.category === 'SPORT' && !draft.sport) return 'Scegli lo sport.';
    if (!Number.isInteger(draft.minCapacity) || draft.minCapacity < 2 || draft.minCapacity > 20) return 'Il quorum deve essere tra 2 e 20.';
    if (!Number.isInteger(draft.capacity) || draft.capacity < draft.minCapacity || draft.capacity > 30) return 'La capienza deve essere tra il quorum e 30 persone.';
    return '';
  };

  const goToCreateStepTwo = () => {
    const error = validateDraft(createDraft);
    if (error) {
      setCreateError(error);
      return;
    }
    setCreateError('');
    setCreateStep(2);
  };

  const createGroup = () => {
    const error = validateDraft(createDraft);
    if (error) {
      setCreateError(error);
      setCreateStep(1);
      return;
    }
    const venue = VENUES.find((item) => item.id === createDraft.venueId);
    if (!venue) {
      setCreateError('Seleziona un locale disponibile.');
      return;
    }
    if (!appUser.age) return;
    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      creatorId: appUser.id,
      category: createDraft.category,
      sport: createDraft.category === 'SPORT' ? createDraft.sport : undefined,
      name: createDraft.name.trim(),
      description: createDraft.description.trim() || 'Nuovo evento creato dalla community Lodidentro.',
      vibe: createDraft.vibe,
      ageRange: createDraft.ageRange,
      minCapacity: createDraft.minCapacity,
      capacity: createDraft.capacity,
      members: [{ id: appUser.id, name: appUser.name.split(' ')[0], age: appUser.age, avatar: appUser.avatar, instagram: appUser.instagram || undefined, verified: appUser.verified }],
      bookingStatus: createDraft.minCapacity <= 1 ? 'BOOKED' : 'OPEN',
      selectedVenue: venue,
      selectedDate: new Date(createDraft.date).toISOString(),
      code: randomCode(createDraft.category === 'CENA' ? 'C' : createDraft.category === 'APERITIVO' ? 'A' : 'S'),
      checkedInUserIds: [],
      messages: [{ id: `message_${Date.now()}`, senderId: appUser.id, sender: appUser.name.split(' ')[0], text: 'Evento creato! Appena raggiungiamo il quorum arriva la conferma.', time: 'Adesso' }],
      createdAt: new Date().toISOString(),
    };
    setGroups((items) => [newGroup, ...items]);
    setSelectedGroupId(newGroup.id);
    setCreateOpen(false);
    setPreviousView('my-events');
    setCurrentView('group-detail');
    addNotification('Evento pubblicato', `${newGroup.name} è visibile nella community.`, 'fa-calendar-plus', newGroup.id);
    setToast('Evento pubblicato con successo.');
  };

  const openEditEvent = (group: Group) => {
    if (group.creatorId !== appUser.id) return;
    setEditEventDraft({ category: group.category, sport: group.sport ?? 'Padel', name: group.name, date: toLocalDateTimeInput(group.selectedDate), description: group.description, vibe: group.vibe, ageRange: group.ageRange, venueId: group.selectedVenue.id, minCapacity: group.minCapacity, capacity: group.capacity });
    setSheet('EDIT_EVENT');
  };

  const saveEditedEvent = () => {
    if (!selectedGroup || selectedGroup.creatorId !== appUser.id) return;
    const error = validateDraft(editEventDraft);
    if (error) {
      setToast(error);
      return;
    }
    const venue = VENUES.find((item) => item.id === editEventDraft.venueId) ?? selectedGroup.selectedVenue;
    updateGroup(selectedGroup.id, (group) => ({ ...group, name: editEventDraft.name.trim(), description: editEventDraft.description.trim(), selectedDate: new Date(editEventDraft.date).toISOString(), vibe: editEventDraft.vibe, ageRange: editEventDraft.ageRange, minCapacity: editEventDraft.minCapacity, capacity: Math.max(editEventDraft.capacity, group.members.length), selectedVenue: venue }));
    setSheet(null);
    addNotification('Evento aggiornato', selectedGroup.name, 'fa-pen', selectedGroup.id);
    setToast('Modifiche salvate.');
  };

  const openReport = (group: Group, member?: Member) => {
    if (!isSignedIn) {
      requestSignIn(`/?event=${group.id}&action=join`);
      return;
    }
    setSelectedMember(member ?? null);
    setReportDraft({ targetUserId: member?.id, targetGroupId: group.id, reason: 'Comportamento inappropriato', note: '' });
    setSheet('REPORT');
  };

  const submitReport = () => {
    const reports = safeParse<ReportDraft[]>(window.localStorage.getItem(STORAGE.reports), []);
    window.localStorage.setItem(STORAGE.reports, JSON.stringify([...reports, reportDraft]));
    setSheet(null);
    setToast('Segnalazione inviata. Grazie.');
  };

  const blockSelectedMember = () => {
    if (!selectedMember || selectedMember.id === appUser.id) return;
    setBlockedUserIds((items) => items.includes(selectedMember.id) ? items : [...items, selectedMember.id]);
    setSheet(null);
    setToast(`${selectedMember.name} è stato bloccato.`);
  };

  const saveProfile = () => {
    const age = Number(profileDraft.age);
    if (!profileDraft.name.trim()) return setToast('Inserisci il tuo nome.');
    if (!Number.isInteger(age) || age < 18 || age > 80) return setToast('Inserisci un’età valida (18–80).');
    if (!profileDraft.city.trim()) return setToast('Inserisci la tua città.');
    const next = { ...profileDraft, name: profileDraft.name.trim(), city: profileDraft.city.trim(), age, instagram: normalizeInstagram(profileDraft.instagram) };
    setAppUser(next);
    setProfileDraft(next);
    setProfileCompleted(true);
    setSheet(null);
    setToast('Profilo aggiornato.');

    const pending = pendingAction;
    setPendingAction(null);
    if (pending?.type === 'JOIN' && pending.groupId) {
      const group = groups.find((item) => item.id === pending.groupId);
      if (group) setTimeout(() => joinGroupInternalWithUser(group, next), 0);
    }
    if (pending?.type === 'CREATE') setTimeout(openCreateInternal, 0);
  };

  const joinGroupInternalWithUser = (group: Group, user: AppUser) => {
    if (!user.age || isUserInGroup(group, user.id) || group.members.length >= group.capacity) return;
    const member: Member = { id: user.id, name: user.name.split(' ')[0], age: user.age, avatar: user.avatar, instagram: user.instagram || undefined, verified: user.verified };
    updateGroup(group.id, (current) => {
      const members = [...current.members, member];
      return { ...current, members, bookingStatus: current.bookingStatus === 'OPEN' && members.length >= current.minCapacity ? 'BOOKED' : current.bookingStatus, messages: [...current.messages, { id: `system_join_${Date.now()}`, senderId: 'system', sender: 'Lodidentro', text: `${member.name} si è unito al gruppo.`, time: 'Adesso' }] };
    });
    addNotification('Posto confermato', `${group.name} · ${formatEventDate(group.selectedDate)}`, 'fa-user-plus', group.id);
    setToast('Profilo completato e posto confermato.');
  };

  const toggleInterest = (interest: string) => setProfileDraft((draft) => ({ ...draft, interests: draft.interests.includes(interest) ? draft.interests.filter((item) => item !== interest) : [...draft.interests, interest].slice(0, 6) }));

  const navItems: Array<{ view: View; label: string; icon: string }> = [
    { view: 'home', label: 'Home', icon: 'fa-house' },
    { view: 'explore', label: 'Scopri', icon: 'fa-compass' },
    { view: 'my-events', label: 'Eventi', icon: 'fa-people-group' },
    { view: 'profile', label: 'Profilo', icon: 'fa-user' },
  ];

  if (!hydrated) return <ClerkLoadingScreen />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0f172a] text-slate-950 sm:p-3 xl:p-6">
      <div className="relative flex h-dvh w-full min-w-0 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100%-1.5rem)] sm:max-w-[820px] xl:h-[900px] xl:max-w-[430px] flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[1024px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#1e293b] xl:max-h-[92vh] xl:rounded-[2.5rem] xl:border-[8px]">
        <header className="z-40 shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <button type="button" onClick={() => navigate('home')} className="flex items-center gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100" aria-label="Vai alla home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E63946] text-base font-black text-white shadow-md shadow-red-200">L</span>
              <span><span className="block text-sm font-black leading-none tracking-tight">LODIDENTRO</span><span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#E63946]">social</span></span>
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => navigate('notifications')} className="relative grid h-11 w-11 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#E63946]" aria-label={`Notifiche${unreadCount ? `, ${unreadCount} non lette` : ''}`}>
                <i className="fa-regular fa-bell" aria-hidden="true" />
                {unreadCount > 0 && <span className="absolute right-2 top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#E63946] px-1 text-[8px] font-black text-white ring-2 ring-white">{unreadCount}</span>}
              </button>
              <button type="button" onClick={() => navigate('profile')} className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-slate-600 shadow ring-1 ring-slate-200" aria-label={isSignedIn ? 'Apri profilo' : 'Accedi o registrati'}>
                {isSignedIn ? <Avatar member={{ name: appUser.name, avatar: appUser.avatar }} /> : <i className="fa-regular fa-user" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </header>

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28">
          {currentView === 'home' && (
            <div className="px-4 py-5">
              <section className="overflow-hidden rounded-[30px] bg-[#1D3557] p-5 text-white shadow-xl">
                <div className="relative">
                  <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#E63946]/20 blur-3xl" />
                  <div className="relative">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-200"><i className="fa-solid fa-location-dot text-red-300" /> Lodi e provincia</div>
                    <h1 className="text-[28px] font-black leading-[1.05] tracking-tight">{isSignedIn ? `Ciao ${appUser.name.split(' ')[0]}, cosa facciamo?` : 'Cosa ti va di fare a Lodi?'}</h1>
                    <p className="mt-3 text-[13px] leading-6 text-slate-300">Trova un gruppo, guarda data e locale, poi unisciti quando trovi il programma giusto.</p>
                    {!isSignedIn && <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2.5 text-[11px] leading-5 text-slate-200"><i className="fa-solid fa-eye mr-2" />Puoi esplorare tutto senza account. Il login serve solo per partecipare.</p>}
                    <div className="mt-5 grid gap-2.5">
                      <button type="button" onClick={() => openExplore('TUTTI')} className="min-h-12 rounded-2xl bg-[#E63946] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20">Scopri gli eventi <i className="fa-solid fa-arrow-right ml-2 text-xs" /></button>
                      <button type="button" onClick={openCreate} className="min-h-12 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white"><i className="fa-solid fa-plus mr-2 text-xs" />Crea il tuo evento</button>
                    </div>
                  </div>
                </div>
              </section>

              {isSignedIn && !profileCompleted && (
                <button type="button" onClick={() => startOnboarding()} className="mt-4 flex w-full items-center gap-3 rounded-[24px] border border-amber-100 bg-amber-50 p-4 text-left">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-600 shadow-sm"><i className="fa-solid fa-user-pen" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">Completa il profilo</span><span className="mt-0.5 block text-[11px] leading-5 text-slate-500">Servono età, città e interessi per entrare nei gruppi.</span></span>
                  <i className="fa-solid fa-chevron-right text-xs text-amber-500" />
                </button>
              )}

              <section className="mt-7">
                <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Parti da qui</p><h2 className="mt-1 text-xl font-black">Cosa ti va?</h2></div><button type="button" onClick={() => openExplore()} className="text-xs font-extrabold text-slate-500">Vedi tutto</button></div>
                <div className="grid gap-3">
                  {(Object.keys(CATEGORY_META) as Category[]).map((category) => {
                    const meta = CATEGORY_META[category];
                    const count = activeGroups.filter((group) => group.category === category).length;
                    return <button key={category} type="button" onClick={() => openExplore(category)} className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm"><span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', meta.soft, meta.accent)}><i className={cn('fa-solid', meta.icon)} /></span><span className="min-w-0 flex-1"><span className="block font-black">{meta.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{meta.description}</span></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">{count}</span></button>;
                  })}
                </div>
              </section>

              <section className="mt-7">
                <div className="mb-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Quasi pronti</p><h2 className="mt-1 text-xl font-black">Manca pochissimo al quorum</h2></div>
                <div className="grid gap-3">
                  {[...activeGroups].filter((group) => group.members.length < group.capacity).sort((a, b) => (a.minCapacity - a.members.length) - (b.minCapacity - b.members.length)).slice(0, 3).map((group) => <EventCard key={group.id} group={group} currentUserId={appUser.id} favorite={favorites.includes(group.id)} onFavorite={() => toggleFavorite(group.id)} onOpen={() => openGroup(group.id, 'home')} />)}
                </div>
              </section>

              <section className="mt-7 rounded-[26px] bg-slate-50 p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Come funziona</p>
                <h2 className="mt-1 text-lg font-black">Semplice: scegli, raggiungi il quorum, presentati.</h2>
                <div className="mt-4 space-y-3">
                  {[['fa-magnifying-glass', 'Trova il programma', 'Filtra cena, aperitivo o sport e controlla subito data e locale.'], ['fa-people-group', 'Il gruppo si conferma', 'Quando si raggiunge il numero minimo, l’evento passa a confermato.'], ['fa-location-dot', 'Ci si vede davvero', 'Chat, codice evento e check-in restano nell’app.']].map(([icon, title, text]) => <div key={title} className="flex gap-3 rounded-2xl bg-white p-3.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-[#E63946]"><i className={cn('fa-solid', icon)} /></span><span><span className="block text-xs font-black text-slate-900">{title}</span><span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{text}</span></span></div>)}
                </div>
              </section>
            </div>
          )}

          {currentView === 'explore' && (
            <div className="px-4 py-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Scopri</p>
              <div className="mt-1 flex items-end justify-between gap-3"><div><h1 className="text-2xl font-black tracking-tight">Trova il prossimo programma</h1><p className="mt-1 text-xs leading-5 text-slate-500">Eventi con data, luogo e posti visibili prima di unirti.</p></div><button type="button" onClick={openCreate} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><i className="fa-solid fa-plus text-xs" /></button></div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"><i className="fa-solid fa-magnifying-glass text-sm text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cerca evento, sport, locale..." className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-slate-400" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="grid h-8 w-8 place-items-center rounded-full text-slate-400"><i className="fa-solid fa-xmark" /></button>}</div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(['TUTTI', 'CENA', 'APERITIVO', 'SPORT'] as FilterCategory[]).map((filter) => <button key={filter} type="button" onClick={() => setExploreFilter(filter)} className={cn('min-h-10 shrink-0 rounded-full px-4 text-xs font-extrabold', exploreFilter === filter ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600')}>{filter === 'TUTTI' ? 'Tutti' : CATEGORY_META[filter].label}</button>)}
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <select value={eventSort} onChange={(event) => setEventSort(event.target.value as EventSort)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 outline-none"><option value="DATE">Prima i più vicini</option><option value="QUORUM">Più vicini al quorum</option><option value="AVAILABILITY">Più posti liberi</option></select>
                <button type="button" onClick={() => setOnlyAvailable((value) => !value)} className={cn('min-h-10 rounded-xl border px-3 text-[11px] font-bold', onlyAvailable ? 'border-red-100 bg-red-50 text-[#E63946]' : 'border-slate-200 bg-white text-slate-500')}><i className="fa-solid fa-chair mr-1.5" />Posti</button>
              </div>

              <div className="mt-5 flex items-center justify-between"><p className="text-xs font-bold text-slate-700">{filteredGroups.length} eventi</p><span className="text-[10px] text-slate-400">aggiornati ora</span></div>
              <div className="mt-3 grid gap-3">{filteredGroups.map((group) => <EventCard key={group.id} group={group} currentUserId={appUser.id} favorite={favorites.includes(group.id)} onFavorite={() => toggleFavorite(group.id)} onOpen={() => openGroup(group.id, 'explore')} />)}</div>
              {filteredGroups.length === 0 && <div className="mt-5"><EmptyState icon="fa-calendar-xmark" title="Nessun evento trovato" description="Prova a cambiare filtri o crea tu il prossimo gruppo." action={<button type="button" onClick={openCreate} className="rounded-xl bg-[#E63946] px-4 py-2.5 text-xs font-extrabold text-white">Crea evento</button>} /></div>}
            </div>
          )}

          {currentView === 'my-events' && (
            <div className="px-4 py-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">I miei eventi</p>
              <div className="mt-1 flex items-end justify-between"><div><h1 className="text-2xl font-black">Dove ci vediamo</h1><p className="mt-1 text-xs text-slate-500">Tutto ciò che riguarda le tue attività.</p></div><button type="button" onClick={openCreate} className="grid h-10 w-10 place-items-center rounded-xl bg-[#E63946] text-white"><i className="fa-solid fa-plus text-xs" /></button></div>
              <div className="mt-5 grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
                {([['JOINED', 'Partecipo'], ['CREATED', 'Creati'], ['SAVED', 'Salvati']] as Array<[MyEventsTab, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setMyEventsTab(value)} className={cn('min-h-9 rounded-xl text-[10px] font-extrabold transition', myEventsTab === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500')}>{label}</button>)}
              </div>
              <div className="mt-4 grid gap-3">{myGroups.map((group) => <EventCard key={group.id} group={group} currentUserId={appUser.id} favorite={favorites.includes(group.id)} onFavorite={() => toggleFavorite(group.id)} onOpen={() => openGroup(group.id, 'my-events')} />)}</div>
              {myGroups.length === 0 && <div className="mt-5"><EmptyState icon={myEventsTab === 'SAVED' ? 'fa-bookmark' : 'fa-people-group'} title={myEventsTab === 'SAVED' ? 'Nessun evento salvato' : 'Ancora nulla qui'} description={myEventsTab === 'CREATED' ? 'Gli eventi che crei compariranno qui.' : myEventsTab === 'SAVED' ? 'Tocca il segnalibro sugli eventi che vuoi ritrovare.' : 'Quando ti unisci a un gruppo lo ritrovi qui.'} action={<button type="button" onClick={() => openExplore()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white">Scopri eventi</button>} /></div>}
            </div>
          )}

          {currentView === 'group-detail' && selectedGroup && (() => {
            const group = selectedGroup;
            const joined = isUserInGroup(group, appUser.id);
            const creator = group.creatorId === appUser.id;
            const full = group.members.length >= group.capacity;
            const status = getGroupStatus(group);
            const statusValue = effectiveStatus(group);
            const checkedIn = group.checkedInUserIds.includes(appUser.id);
            const canSeeContacts = joined && statusValue === 'BOOKED';
            const checkInAvailable = joined && canCheckInNow(group);
            const visibleMembers = group.members.filter((member) => !blockedUserIds.includes(member.id));

            return (
              <div className="px-4 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <button type="button" onClick={() => navigate(previousView === 'group-detail' ? 'explore' : previousView)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-extrabold text-slate-700"><i className="fa-solid fa-arrow-left" />Indietro</button>
                  <div className="flex gap-2"><button type="button" onClick={() => toggleFavorite(group.id)} className={cn('grid h-10 w-10 place-items-center rounded-full bg-slate-100', favorites.includes(group.id) ? 'text-[#E63946]' : 'text-slate-600')} aria-label="Salva"><i className={cn(favorites.includes(group.id) ? 'fa-solid' : 'fa-regular', 'fa-bookmark')} /></button><button type="button" onClick={() => shareGroup(group)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Condividi"><i className="fa-solid fa-arrow-up-from-bracket" /></button></div>
                </div>

                <section className="rounded-[30px] bg-[#1D3557] p-5 text-white shadow-xl">
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-200">{group.sport ?? CATEGORY_META[group.category].label}</span><span className={cn('rounded-full px-3 py-1.5 text-[10px] font-extrabold', status.tone)}>{status.label}</span></div>
                  <h1 className="mt-4 text-[26px] font-black leading-tight tracking-tight">{group.name}</h1>
                  <p className="mt-3 text-[13px] leading-6 text-slate-300">{group.description}</p>
                  <div className="mt-5 grid gap-2.5">
                    {[['fa-calendar', 'Quando', formatEventDate(group.selectedDate)], ['fa-location-dot', 'Dove', `${group.selectedVenue.name} · ${group.selectedVenue.zone}`], ['fa-face-smile', 'Vibe', `${group.vibe} · ${group.ageRange}`]].map(([icon, label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wide text-slate-400"><i className={cn('fa-solid', icon)} />{label}</div><p className="mt-1 text-xs font-bold leading-5">{value}</p></div>)}
                  </div>
                </section>

                <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Partecipazione</p><h2 className="mt-1 text-lg font-black">{group.members.length}/{group.capacity} partecipanti</h2></div><AvatarStack members={group.members} max={5} /></div>
                  <div className="mt-4"><ProgressBar group={group} /></div>
                  {!joined && statusValue !== 'CANCELLED' && statusValue !== 'COMPLETED' && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-[11px] leading-5 text-slate-600">Unendoti confermi il tuo posto. Chat e contatti si sbloccano solo per i partecipanti.</p><button type="button" disabled={full} onClick={() => joinGroup(group)} className="mt-3 min-h-12 w-full rounded-2xl bg-[#E63946] px-4 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400">{full ? 'Evento completo' : isSignedIn ? 'Unisciti all’evento' : 'Accedi per unirti'}</button></div>}
                  {joined && <div className="mt-4 rounded-2xl bg-emerald-50 p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-600"><i className="fa-solid fa-check" /></span><div className="min-w-0 flex-1"><p className="text-xs font-black text-emerald-900">Sei dentro al gruppo</p><p className="mt-0.5 text-[10px] leading-5 text-emerald-700">Riceverai gli aggiornamenti importanti dell’evento.</p></div></div>{!creator && statusValue !== 'COMPLETED' && statusValue !== 'CANCELLED' && <button type="button" onClick={() => leaveGroup(group)} className="mt-3 w-full rounded-xl border border-emerald-200 bg-white py-2.5 text-[11px] font-extrabold text-slate-600">Lascia il gruppo</button>}</div>}
                  {creator && <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => openEditEvent(group)} className="min-h-10 rounded-xl border border-slate-200 bg-white text-[11px] font-extrabold text-slate-700"><i className="fa-solid fa-pen mr-1.5" />Modifica</button><button type="button" disabled={statusValue === 'CANCELLED' || statusValue === 'COMPLETED'} onClick={() => cancelGroup(group)} className="min-h-10 rounded-xl border border-red-100 bg-red-50 text-[11px] font-extrabold text-red-600 disabled:opacity-40"><i className="fa-solid fa-ban mr-1.5" />Annulla</button></div>}
                </section>

                <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Il gruppo</p><h2 className="mt-1 text-lg font-black">Chi partecipa</h2></div>{!canSeeContacts && <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold text-slate-500"><i className="fa-solid fa-lock mr-1" />contatti protetti</span>}</div>
                  <div className="mt-4 space-y-2.5">
                    {visibleMembers.map((member) => {
                      const isMe = member.id === appUser.id;
                      const instagramVisible = canSeeContacts && member.instagram && (!isMe || preferences.showInstagramAfterConfirm);
                      return <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><Avatar member={member} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-xs font-black">{member.name}{preferences.showAge || !isMe ? `, ${member.age}` : ''}{isMe ? ' (tu)' : ''}</p>{member.verified && <i className="fa-solid fa-circle-check text-[10px] text-sky-500" />}</div><p className="mt-0.5 truncate text-[10px] text-slate-500">{instagramVisible ? member.instagram : canSeeContacts ? 'Contatto non condiviso' : 'Visibile dopo la conferma'}</p></div>{instagramVisible && <a href={`https://instagram.com/${member.instagram?.replace('@', '')}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-xl bg-white text-pink-600 shadow-sm" aria-label={`Instagram di ${member.name}`}><i className="fa-brands fa-instagram" /></a>}{!isMe && isSignedIn && <button type="button" onClick={() => { setSelectedMember(member); setSheet('MEMBER_ACTIONS'); }} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400" aria-label="Azioni utente"><i className="fa-solid fa-ellipsis" /></button>}</div>;
                    })}
                    {visibleMembers.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Tutti i partecipanti sono nascosti perché bloccati.</p>}
                  </div>
                </section>

                <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Locale partner</p><div className="mt-1 flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">{group.selectedVenue.name}</h2><p className="mt-1 text-[11px] text-slate-500">{group.selectedVenue.zone} · {group.selectedVenue.priceRange}</p></div>{group.selectedVenue.rating && <span className="rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700"><i className="fa-solid fa-star mr-1 text-[10px]" />{group.selectedVenue.rating}</span>}</div><p className="mt-3 text-[11px] leading-5 text-slate-600">{group.selectedVenue.desc}</p><div className="mt-3 rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Pagamento</p><p className="mt-1 text-[11px] leading-5 text-slate-700">{group.selectedVenue.customOrderNote}</p></div>
                </section>

                {joined && (
                  <section className="mt-4 rounded-[26px] bg-slate-950 p-5 text-white shadow-xl">
                    <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Codice evento</p><p className="mt-1 text-3xl font-black tracking-[0.18em]">{group.code}</p></div><span className={cn('rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase', checkedIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300')}>{checkedIn ? 'check-in ok' : 'da usare sul posto'}</span></div>
                    <p className="mt-3 text-[11px] leading-5 text-slate-400">Il check-in si apre 4 ore prima e resta disponibile fino a 8 ore dopo l’orario dell’evento.</p>
                    <button type="button" disabled={checkedIn || !checkInAvailable} onClick={() => handleCheckIn(group)} className="mt-4 min-h-11 w-full rounded-2xl bg-[#E63946] px-4 text-xs font-black text-white disabled:bg-white/10 disabled:text-slate-500">{checkedIn ? 'Check-in effettuato' : checkInAvailable ? 'Effettua check-in' : 'Check-in non ancora disponibile'}</button>
                  </section>
                )}

                {joined && (
                  <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Gruppo</p><h2 className="mt-1 text-lg font-black">Chat evento</h2></div><span className="text-[9px] font-bold text-slate-400">solo partecipanti</span></div>
                    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">{group.messages.length === 0 && <p className="py-5 text-center text-xs text-slate-400">Ancora nessun messaggio.</p>}{group.messages.map((message) => message.senderId === 'system' ? <p key={message.id} className="py-1 text-center text-[9px] font-semibold text-slate-400">{message.text}</p> : <div key={message.id} className={cn('flex', message.senderId === appUser.id ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[84%] rounded-2xl px-3.5 py-2.5', message.senderId === appUser.id ? 'rounded-br-md bg-[#E63946] text-white' : 'rounded-bl-md bg-slate-100 text-slate-700')}>{message.senderId !== appUser.id && <p className="mb-1 text-[9px] font-black text-slate-900">{message.sender}</p>}<p className="text-xs leading-5">{message.text}</p><p className={cn('mt-1 text-right text-[8px]', message.senderId === appUser.id ? 'text-red-100' : 'text-slate-400')}>{message.time}</p></div></div>)}</div>
                    <form onSubmit={sendMessage} className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><input value={chatText} onChange={(event) => setChatText(event.target.value)} maxLength={500} disabled={statusValue === 'CANCELLED'} placeholder={statusValue === 'CANCELLED' ? 'Chat chiusa: evento annullato' : 'Scrivi al gruppo...'} className="min-h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none disabled:text-slate-400" /><button type="submit" disabled={!chatText.trim() || statusValue === 'CANCELLED'} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#E63946] text-white disabled:bg-slate-200" aria-label="Invia"><i className="fa-solid fa-paper-plane text-xs" /></button></form>
                  </section>
                )}

                <button type="button" onClick={() => openReport(group)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[11px] font-bold text-slate-400 hover:text-[#E63946]"><i className="fa-solid fa-shield-halved" />Segnala un problema con questo evento</button>
              </div>
            );
          })()}

          {currentView === 'notifications' && (
            <div className="px-4 py-5">
              <div className="flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Aggiornamenti</p><h1 className="mt-1 text-2xl font-black">Notifiche</h1></div><button type="button" onClick={() => setSheet('NOTIFICATIONS')} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><i className="fa-solid fa-sliders text-xs" /></button></div>
              {unreadCount > 0 && <button type="button" onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} className="mt-4 text-[11px] font-extrabold text-[#E63946]">Segna tutte come lette</button>}
              <div className="mt-4 space-y-3">{notifications.map((notification) => <button type="button" key={notification.id} onClick={() => { setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item)); if (notification.groupId && groups.some((group) => group.id === notification.groupId)) openGroup(notification.groupId, 'notifications'); }} className={cn('flex w-full items-start gap-3 rounded-[22px] border p-4 text-left', notification.read ? 'border-slate-200 bg-white' : 'border-red-100 bg-red-50/40')}><span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', notification.read ? 'bg-slate-100 text-slate-500' : 'bg-white text-[#E63946]')}><i className={cn('fa-solid', notification.icon)} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-xs font-black text-slate-900">{notification.title}</span>{!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E63946]" />}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{notification.description}</span><span className="mt-2 block text-[9px] text-slate-400">{notification.time}</span></span></button>)}</div>
              {notifications.length === 0 && <div className="mt-5"><EmptyState icon="fa-bell-slash" title="Tutto tranquillo" description="Le notifiche su eventi e gruppi compariranno qui." /></div>}
              {notifications.some((item) => item.read) && <button type="button" onClick={() => setNotifications((items) => items.filter((item) => !item.read))} className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-[11px] font-bold text-slate-500">Rimuovi notifiche lette</button>}
            </div>
          )}

          {currentView === 'profile' && (
            <div className="px-4 py-5">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4"><span className="relative"><Avatar member={{ name: appUser.name, avatar: appUser.avatar }} size="lg" />{appUser.verified && <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-sky-500 text-[9px] text-white ring-3 ring-white"><i className="fa-solid fa-check" /></span>}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Il tuo profilo</p><h1 className="mt-1 truncate text-xl font-black">{appUser.name}{appUser.age ? `, ${appUser.age}` : ''}</h1><p className="mt-1 text-[11px] text-slate-500"><i className="fa-solid fa-location-dot mr-1 text-[#E63946]" />{appUser.city || 'Città non impostata'}</p></div><button type="button" onClick={() => { setProfileDraft(appUser); setSheet('EDIT_PROFILE'); }} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><i className="fa-solid fa-pen text-xs" /></button></div>
                {!profileCompleted && <button type="button" onClick={() => startOnboarding()} className="mt-4 w-full rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">Completa il profilo per partecipare</button>}
                <div className="mt-4 flex flex-wrap gap-1.5">{appUser.interests.length ? appUser.interests.map((interest) => <span key={interest} className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">#{interest}</span>) : <span className="text-[11px] text-slate-400">Nessun interesse selezionato</span>}</div>
              </section>

              <div className="mt-4 grid grid-cols-3 gap-2">{[['Eventi', joinedGroups.length.toString()], ['Creati', createdGroups.length.toString()], ['Salvati', favorites.length.toString()]].map(([label, value]) => <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-3 text-center"><p className="text-lg font-black">{value}</p><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p></div>)}</div>

              <section className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                {[['PRIVACY', 'fa-user-shield', 'Privacy e sicurezza', 'Contatti, visibilità e utenti bloccati.'], ['NOTIFICATIONS', 'fa-bell', 'Preferenze notifiche', 'Scegli quali aggiornamenti ricevere.'], ['RULES', 'fa-circle-question', 'Aiuto e regole community', 'Come funzionano eventi, sicurezza e segnalazioni.']].map(([value, icon, title, description], index) => <button key={value} type="button" onClick={() => setSheet(value as Sheet)} className={cn('flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50', index > 0 && 'border-t border-slate-100')}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><i className={cn('fa-solid', icon)} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-black">{title}</span><span className="mt-0.5 block text-[10px] leading-5 text-slate-500">{description}</span></span><i className="fa-solid fa-chevron-right text-[10px] text-slate-300" /></button>)}
              </section>

              {canAccessBusiness && <button type="button" onClick={() => navigate('business')} className="mt-4 flex w-full items-center gap-4 rounded-[24px] bg-slate-950 p-4 text-left text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-amber-300"><i className="fa-solid fa-chart-pie" /></span><span className="min-w-0 flex-1"><span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Area riservata</span><span className="mt-1 block text-sm font-black">Lodidentro Admin</span></span><i className="fa-solid fa-arrow-right text-xs text-slate-500" /></button>}

              <SignOutButton redirectUrl="/"><button type="button" className="mt-5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 hover:bg-red-50 hover:text-[#E63946]"><i className="fa-solid fa-right-from-bracket mr-2" />Esci dall’account</button></SignOutButton>
            </div>
          )}

          {currentView === 'business' && canAccessBusiness && (
            <div className="px-4 py-5">
              <button type="button" onClick={() => navigate('profile')} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-extrabold text-slate-700"><i className="fa-solid fa-arrow-left" />Profilo</button>
              <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-300">B2B partner dashboard</p><h1 className="mt-2 text-2xl font-black">Lodidentro Admin</h1><p className="mt-2 text-[11px] leading-5 text-slate-400">Area visibile solo a profili partner o admin. I dati restano demo finché non li colleghi a Prisma.</p></section>
              <div className="mt-4 grid grid-cols-2 gap-2">{[['Utenti', ADMIN_STATS.usersRegistered.toLocaleString('it-IT')], ['Attivi', ADMIN_STATS.usersActive.toLocaleString('it-IT')], ['Gruppi', ADMIN_STATS.groupsCompleted.toString()], ['Ricavi B2B', formatEuro(ADMIN_STATS.totalRevenue)]].map(([label, value]) => <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4"><p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}</div>
              <h2 className="mt-6 text-lg font-black">Locali partner</h2><div className="mt-3 space-y-3">{VENUES.map((venue) => <div key={venue.id} className="rounded-[22px] border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><div><h3 className="text-xs font-black">{venue.name}</h3><p className="mt-1 text-[10px] text-slate-500">{venue.zone} · {venue.priceRange}</p></div><span className="text-[10px] font-black text-[#E63946]">{venue.eventsHosted ?? 0} eventi</span></div><div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3"><div><p className="text-[8px] font-bold uppercase text-slate-400">Clienti</p><p className="mt-1 text-sm font-black">{venue.clientsBrought ?? 0}</p></div><div><p className="text-[8px] font-bold uppercase text-slate-400">Valore</p><p className="mt-1 text-sm font-black text-emerald-600">{formatEuro(venue.revenueGenerated ?? 0)}</p></div></div></div>)}</div>
            </div>
          )}
        </main>

        <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl" aria-label="Navigazione principale">
          <div className="mx-auto grid grid-cols-5 items-end">
            {navItems.slice(0, 2).map((item) => <button key={item.view} type="button" onClick={() => navigate(item.view)} className={cn('flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold', currentView === item.view ? 'text-[#E63946]' : 'text-slate-400')}><i className={cn('fa-solid text-base', item.icon)} />{item.label}</button>)}
            <button type="button" onClick={openCreate} className="mx-auto -mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#E63946] text-white shadow-xl shadow-red-200 ring-4 ring-white" aria-label="Crea evento"><i className="fa-solid fa-plus text-lg" /></button>
            {navItems.slice(2).map((item) => { const active = currentView === item.view || (item.view === 'my-events' && currentView === 'group-detail' && previousView === 'my-events'); return <button key={item.view} type="button" onClick={() => navigate(item.view)} className={cn('flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold', active ? 'text-[#E63946]' : 'text-slate-400')}><i className={cn('fa-solid text-base', item.icon)} />{item.label}</button>; })}
          </div>
        </nav>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm md:items-center md:p-4" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}>
          <section role="dialog" aria-modal="true" className="max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[32px] sm:max-w-[560px] bg-white shadow-2xl md:rounded-[32px]">
            <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur-xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Passaggio {createStep} di 2</p><h2 className="mt-1 text-xl font-black">Crea un nuovo evento</h2></div><button type="button" onClick={() => setCreateOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500"><i className="fa-solid fa-xmark" /></button></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="h-1.5 rounded-full bg-[#E63946]" /><div className={cn('h-1.5 rounded-full', createStep === 2 ? 'bg-[#E63946]' : 'bg-slate-100')} /></div></header>
            <div className="px-5 py-5">
              {createError && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700"><i className="fa-solid fa-circle-exclamation mr-2" />{createError}</div>}
              {createStep === 1 ? (
                <div className="space-y-4">
                  <div><p className="mb-2 text-xs font-extrabold text-slate-700">Cosa vuoi organizzare?</p><div className="grid grid-cols-3 gap-2">{(Object.keys(CATEGORY_META) as Category[]).map((category) => { const meta = CATEGORY_META[category]; return <button key={category} type="button" onClick={() => setCreateDraft((draft) => ({ ...draft, category }))} className={cn('min-h-20 rounded-2xl border p-3 text-center', createDraft.category === category ? 'border-[#E63946] bg-red-50 text-[#E63946]' : 'border-slate-200 text-slate-600')}><i className={cn('fa-solid block text-lg', meta.icon)} /><span className="mt-2 block text-[10px] font-extrabold">{meta.label}</span></button>; })}</div></div>
                  {createDraft.category === 'SPORT' && <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Sport</span><select value={createDraft.sport} onChange={(event) => setCreateDraft((draft) => ({ ...draft, sport: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold"><option>Padel</option><option>Calcetto</option></select></label>}
                  <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Titolo</span><input value={createDraft.name} onChange={(event) => setCreateDraft((draft) => ({ ...draft, name: event.target.value }))} maxLength={70} placeholder="Es. Pizza del sabato a Lodi" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Data e orario</span><input type="datetime-local" value={createDraft.date} onChange={(event) => setCreateDraft((draft) => ({ ...draft, date: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Descrizione <span className="font-medium text-slate-400">(facoltativa)</span></span><textarea value={createDraft.description} onChange={(event) => setCreateDraft((draft) => ({ ...draft, description: event.target.value }))} maxLength={220} rows={3} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" /></label>
                  <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Vibe</span><select value={createDraft.vibe} onChange={(event) => setCreateDraft((draft) => ({ ...draft, vibe: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold"><option>Easy & social</option><option>Chill</option><option>Social</option><option>Sport & relaxed</option><option>Competitivo il giusto</option></select></label><label><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Fascia età</span><select value={createDraft.ageRange} onChange={(event) => setCreateDraft((draft) => ({ ...draft, ageRange: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold"><option>18–25</option><option>20–30</option><option>20–35</option><option>25–35</option><option>30+</option></select></label></div>
                  <button type="button" onClick={goToCreateStepTwo} className="min-h-12 w-full rounded-2xl bg-[#E63946] text-sm font-black text-white">Continua <i className="fa-solid fa-arrow-right ml-2 text-xs" /></button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><p className="text-xs font-extrabold text-slate-700">Scegli il locale</p><p className="mt-0.5 text-[10px] text-slate-400">Mostriamo solo partner compatibili.</p><div className="mt-3 space-y-2">{availableVenues.map((venue) => <button key={venue.id} type="button" onClick={() => setCreateDraft((draft) => ({ ...draft, venueId: venue.id }))} className={cn('w-full rounded-2xl border p-4 text-left', createDraft.venueId === venue.id ? 'border-[#E63946] bg-red-50/60' : 'border-slate-200')}><div className="flex items-start justify-between"><div><p className="text-xs font-black">{venue.name}</p><p className="mt-1 text-[10px] text-slate-500">{venue.zone} · {venue.priceRange} · ★ {venue.rating}</p></div>{createDraft.venueId === venue.id && <i className="fa-solid fa-circle-check text-[#E63946]" />}</div><p className="mt-2 text-[10px] leading-5 text-slate-500">{venue.desc}</p></button>)}</div></div>
                  <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Quorum minimo</span><input type="number" min={2} max={20} value={createDraft.minCapacity} onChange={(event) => setCreateDraft((draft) => ({ ...draft, minCapacity: Number(event.target.value) }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold" /></label><label><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Capienza max</span><input type="number" min={2} max={30} value={createDraft.capacity} onChange={(event) => setCreateDraft((draft) => ({ ...draft, capacity: Number(event.target.value) }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold" /></label></div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-[10px] leading-5 text-slate-500"><i className="fa-solid fa-circle-info mr-2 text-[#E63946]" />L’evento viene pubblicato subito. Quando raggiunge il quorum passa a confermato.</div>
                  <div className="grid grid-cols-[0.8fr_1.2fr] gap-3"><button type="button" onClick={() => setCreateStep(1)} className="min-h-12 rounded-2xl border border-slate-200 text-sm font-extrabold">Indietro</button><button type="button" onClick={createGroup} className="min-h-12 rounded-2xl bg-[#E63946] text-sm font-black text-white">Pubblica evento</button></div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {sheet === 'ONBOARDING' && <SheetFrame title="Completa il profilo" eyebrow="Prima di partecipare" onClose={() => { setSheet(null); setPendingAction(null); }}><div className="space-y-4"><p className="text-[11px] leading-5 text-slate-500">Ci servono poche informazioni per rendere i gruppi più chiari e sicuri.</p><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Nome visibile</span><input value={profileDraft.name} onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold">Età</span><input type="number" min={18} max={80} value={profileDraft.age ?? ''} onChange={(event) => setProfileDraft((draft) => ({ ...draft, age: event.target.value ? Number(event.target.value) : null }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold" /></label><label><span className="mb-1.5 block text-xs font-extrabold">Città</span><input value={profileDraft.city} onChange={(event) => setProfileDraft((draft) => ({ ...draft, city: event.target.value }))} placeholder="Lodi" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold" /></label></div><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Instagram <span className="font-medium text-slate-400">(facoltativo)</span></span><input value={profileDraft.instagram} onChange={(event) => setProfileDraft((draft) => ({ ...draft, instagram: event.target.value }))} placeholder="@username" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold" /></label><div><p className="mb-2 text-xs font-extrabold">Interessi <span className="font-medium text-slate-400">(max 6)</span></p><div className="flex flex-wrap gap-2">{INTEREST_OPTIONS.map((interest) => <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={cn('rounded-full border px-3 py-2 text-[10px] font-bold', profileDraft.interests.includes(interest) ? 'border-red-100 bg-red-50 text-[#E63946]' : 'border-slate-200 bg-white text-slate-600')}>#{interest}</button>)}</div></div><button type="button" onClick={saveProfile} className="min-h-12 w-full rounded-2xl bg-[#E63946] text-sm font-black text-white">Salva e continua</button></div></SheetFrame>}

      {sheet === 'EDIT_PROFILE' && <SheetFrame title="Modifica profilo" onClose={() => setSheet(null)}><div className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Nome</span><input value={profileDraft.name} onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold">Età</span><input type="number" min={18} max={80} value={profileDraft.age ?? ''} onChange={(event) => setProfileDraft((draft) => ({ ...draft, age: event.target.value ? Number(event.target.value) : null }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label><label><span className="mb-1.5 block text-xs font-extrabold">Città</span><input value={profileDraft.city} onChange={(event) => setProfileDraft((draft) => ({ ...draft, city: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label></div><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Instagram</span><input value={profileDraft.instagram} onChange={(event) => setProfileDraft((draft) => ({ ...draft, instagram: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label><div><p className="mb-2 text-xs font-extrabold">Interessi</p><div className="flex flex-wrap gap-2">{INTEREST_OPTIONS.map((interest) => <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={cn('rounded-full border px-3 py-2 text-[10px] font-bold', profileDraft.interests.includes(interest) ? 'border-red-100 bg-red-50 text-[#E63946]' : 'border-slate-200 text-slate-600')}>#{interest}</button>)}</div></div><button type="button" onClick={saveProfile} className="min-h-12 w-full rounded-2xl bg-[#E63946] text-sm font-black text-white">Salva modifiche</button></div></SheetFrame>}

      {sheet === 'PRIVACY' && <SheetFrame title="Privacy e sicurezza" onClose={() => setSheet(null)}><div className="divide-y divide-slate-100"><Toggle checked={preferences.showInstagramAfterConfirm} onChange={(value) => setPreferences((items) => ({ ...items, showInstagramAfterConfirm: value }))} label="Mostra il mio Instagram" description="Solo ai partecipanti, dopo la conferma del gruppo." /><Toggle checked={preferences.showAge} onChange={(value) => setPreferences((items) => ({ ...items, showAge: value }))} label="Mostra la mia età" description="Puoi nasconderla nella scheda partecipanti." /><div className="py-4"><p className="text-xs font-black">Utenti bloccati</p>{blockedUserIds.length === 0 ? <p className="mt-1 text-[11px] text-slate-500">Non hai bloccato nessuno.</p> : <div className="mt-3 space-y-2">{blockedUserIds.map((id) => <div key={id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-[10px] font-bold text-slate-600">{id}</span><button type="button" onClick={() => setBlockedUserIds((items) => items.filter((item) => item !== id))} className="text-[10px] font-black text-[#E63946]">Sblocca</button></div>)}</div>}</div></div></SheetFrame>}

      {sheet === 'NOTIFICATIONS' && <SheetFrame title="Preferenze notifiche" onClose={() => setSheet(null)}><div className="divide-y divide-slate-100"><Toggle checked={preferences.pushEventUpdates} onChange={(value) => setPreferences((items) => ({ ...items, pushEventUpdates: value }))} label="Aggiornamenti eventi" description="Conferme, cambi orario e quorum." /><Toggle checked={preferences.pushChat} onChange={(value) => setPreferences((items) => ({ ...items, pushChat: value }))} label="Messaggi chat" description="Avvisi sui nuovi messaggi nei tuoi gruppi." /><Toggle checked={preferences.pushSuggestions} onChange={(value) => setPreferences((items) => ({ ...items, pushSuggestions: value }))} label="Suggerimenti" description="Nuovi eventi compatibili con i tuoi interessi." /></div><p className="mt-4 text-[10px] leading-5 text-slate-400">Queste preferenze sono già funzionanti nel prototipo locale; le push reali andranno collegate al backend.</p></SheetFrame>}

      {sheet === 'RULES' && <SheetFrame title="Regole della community" onClose={() => setSheet(null)}><div className="space-y-3">{[['fa-handshake', 'Rispetta il gruppo', 'Presentati solo se hai confermato e avvisa per tempo se non puoi venire.'], ['fa-shield-halved', 'Sicurezza prima di tutto', 'Non condividere dati sensibili. Usa blocco e segnalazione se qualcosa non ti convince.'], ['fa-comments', 'Chat utile', 'Niente spam, molestie o messaggi offensivi. La chat serve a coordinare l’evento.'], ['fa-store', 'Rispetta il locale', 'Orari, consumazioni e regole del partner vanno rispettati.']].map(([icon, title, text]) => <div key={title} className="flex gap-3 rounded-2xl bg-slate-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#E63946]"><i className={cn('fa-solid', icon)} /></span><div><p className="text-xs font-black">{title}</p><p className="mt-1 text-[10px] leading-5 text-slate-500">{text}</p></div></div>)}</div></SheetFrame>}

      {sheet === 'MEMBER_ACTIONS' && selectedMember && selectedGroup && <SheetFrame title={selectedMember.name} eyebrow="Azioni partecipante" onClose={() => setSheet(null)}><div className="space-y-3"><button type="button" onClick={() => openReport(selectedGroup, selectedMember)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 text-left text-xs font-black"><i className="fa-solid fa-flag w-5 text-center text-[#E63946]" />Segnala utente</button><button type="button" onClick={blockSelectedMember} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 text-left text-xs font-black text-red-700"><i className="fa-solid fa-ban w-5 text-center" />Blocca utente</button></div></SheetFrame>}

      {sheet === 'REPORT' && <SheetFrame title="Invia segnalazione" eyebrow="Sicurezza" onClose={() => setSheet(null)}><div className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Motivo</span><select value={reportDraft.reason} onChange={(event) => setReportDraft((draft) => ({ ...draft, reason: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm"><option>Comportamento inappropriato</option><option>Spam o truffa</option><option>Molestie</option><option>Profilo falso</option><option>Problema con l’evento</option><option>Altro</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Dettagli <span className="font-medium text-slate-400">(facoltativi)</span></span><textarea value={reportDraft.note} onChange={(event) => setReportDraft((draft) => ({ ...draft, note: event.target.value }))} maxLength={500} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Spiega cosa è successo..." /></label><button type="button" onClick={submitReport} className="min-h-12 w-full rounded-2xl bg-[#E63946] text-sm font-black text-white">Invia segnalazione</button></div></SheetFrame>}

      {sheet === 'EDIT_EVENT' && selectedGroup && <SheetFrame title="Modifica evento" eyebrow="Organizzatore" onClose={() => setSheet(null)}><div className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Titolo</span><input value={editEventDraft.name} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, name: event.target.value }))} maxLength={70} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Data e orario</span><input type="datetime-local" value={editEventDraft.date} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, date: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Locale</span><select value={editEventDraft.venueId} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, venueId: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold">{editAvailableVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.zone}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-extrabold">Descrizione</span><textarea value={editEventDraft.description} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, description: event.target.value }))} rows={3} maxLength={220} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold">Vibe</span><select value={editEventDraft.vibe} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, vibe: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold"><option>Easy & social</option><option>Chill</option><option>Social</option><option>Sport & relaxed</option><option>Competitivo il giusto</option></select></label><label><span className="mb-1.5 block text-xs font-extrabold">Fascia età</span><select value={editEventDraft.ageRange} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, ageRange: event.target.value }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold"><option>18–25</option><option>20–30</option><option>20–35</option><option>25–35</option><option>30+</option></select></label></div><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold">Quorum</span><input type="number" min={2} max={20} value={editEventDraft.minCapacity} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, minCapacity: Number(event.target.value) }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label><label><span className="mb-1.5 block text-xs font-extrabold">Capienza</span><input type="number" min={selectedGroup.members.length} max={30} value={editEventDraft.capacity} onChange={(event) => setEditEventDraft((draft) => ({ ...draft, capacity: Number(event.target.value) }))} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm" /></label></div><button type="button" onClick={saveEditedEvent} className="min-h-12 w-full rounded-2xl bg-[#E63946] text-sm font-black text-white">Salva modifiche</button></div></SheetFrame>}

      {toast && <div className="fixed left-1/2 top-4 z-[70] -translate-x-1/2 px-4" role="status" aria-live="polite"><div className="flex min-w-[280px] max-w-[390px] items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-2xl"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300"><i className="fa-solid fa-check text-[10px]" /></span><span>{toast}</span></div></div>}
    </div>
  );
}
