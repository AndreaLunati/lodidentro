import type { AppPreferences, AppUser, Category, CreateDraft, Group, Member, Venue } from './types';

export const GUEST_USER: AppUser = {
  id: 'guest',
  name: 'Ospite',
  age: null,
  city: 'Lodi',
  avatar: '',
  interests: [],
  email: '',
  instagram: '',
  verified: false,
  role: 'USER',
};

export const VENUES: Venue[] = [
  {
    id: 'v_1',
    name: 'Ristorante Pizzeria La Dogana',
    zone: 'Lodi',
    priceRange: '€€',
    desc: 'Pizza, cucina italiana e tavoli adatti a piccoli gruppi.',
    customOrderNote: 'Ognuno ordina e paga ciò che desidera alla carta.',
    categories: ['CENA'],
    rating: 4.6,
    eventsHosted: 24,
    clientsBrought: 168,
    revenueGenerated: 4200,
  },
  {
    id: 'v_2',
    name: 'Officina del Burger',
    zone: 'Lodi',
    priceRange: '€€',
    desc: 'Burger, piatti informali e atmosfera giovane.',
    customOrderNote: 'Ordinazione libera alla carta e conto individuale.',
    categories: ['CENA'],
    rating: 4.5,
    eventsHosted: 19,
    clientsBrought: 133,
    revenueGenerated: 2926,
  },
  {
    id: 'v_3',
    name: 'Osteria del Sole',
    zone: 'Lodi Vecchio',
    priceRange: '€€€',
    desc: 'Cucina tradizionale e tavoli per piccoli gruppi.',
    customOrderNote: 'Menu alla carta, pagamento direttamente al locale.',
    categories: ['CENA'],
    rating: 4.7,
    eventsHosted: 12,
    clientsBrought: 84,
    revenueGenerated: 2520,
  },
  {
    id: 'v_4',
    name: 'Botanical Cocktail Bar',
    zone: 'Lodi centro',
    priceRange: '€€',
    desc: 'Cocktail bar centrale, ideale per gruppi e nuove conoscenze.',
    customOrderNote: 'Ognuno ordina e paga liberamente al banco o al tavolo.',
    categories: ['APERITIVO'],
    rating: 4.4,
    eventsHosted: 33,
    clientsBrought: 297,
    revenueGenerated: 4752,
  },
  {
    id: 'v_5',
    name: 'Caffè del Corso',
    zone: 'Lodi centro',
    priceRange: '€',
    desc: 'Aperitivo informale e prezzi accessibili.',
    customOrderNote: 'Consumazione libera; eventuali promo gruppo vengono indicate nell’evento.',
    categories: ['APERITIVO'],
    rating: 4.3,
    eventsHosted: 16,
    clientsBrought: 121,
    revenueGenerated: 1980,
  },
  {
    id: 'v_padel',
    name: 'Padel Club Lodi',
    zone: 'San Fereolo',
    priceRange: '€€',
    desc: 'Campi indoor e outdoor con spogliatoi.',
    customOrderNote: 'Costo campo diviso in parti uguali tra i partecipanti.',
    categories: ['SPORT'],
    sports: ['Padel'],
    rating: 4.6,
    eventsHosted: 41,
    clientsBrought: 164,
    revenueGenerated: 3280,
  },
  {
    id: 'v_calcetto',
    name: 'Centro Sportivo San Fereolo',
    zone: 'Lodi',
    priceRange: '€€',
    desc: 'Campi da calcetto e servizi per gruppi.',
    customOrderNote: 'Quota campo divisa tra i giocatori confermati.',
    categories: ['SPORT'],
    sports: ['Calcetto'],
    rating: 4.5,
    eventsHosted: 28,
    clientsBrought: 260,
    revenueGenerated: 3900,
  },
];

const avatar = (seed: string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const USERS = {
  alessio: { id: 'demo_1', name: 'Alessio', age: 23, avatar: avatar('Alessio'), instagram: '@ale.lodi', verified: true },
  giulia: { id: 'demo_2', name: 'Giulia', age: 25, avatar: avatar('Giulia'), instagram: '@giulia.g', verified: true },
  marco: { id: 'demo_3', name: 'Marco', age: 24, avatar: avatar('Marco'), instagram: '@marco.lodi', verified: true },
  sara: { id: 'demo_4', name: 'Sara', age: 22, avatar: avatar('Sara'), instagram: '@sara.99', verified: false },
  luca: { id: 'demo_5', name: 'Luca', age: 26, avatar: avatar('Luca'), instagram: '@lucab', verified: true },
  simone: { id: 'demo_6', name: 'Simone', age: 27, avatar: avatar('Simone'), instagram: '@simo.padel', verified: true },
  elena: { id: 'demo_7', name: 'Elena', age: 24, avatar: avatar('Elena'), instagram: '@elena.e', verified: true },
  davide: { id: 'demo_8', name: 'Davide', age: 25, avatar: avatar('Davide'), instagram: '@davide99', verified: true },
  chiara: { id: 'demo_9', name: 'Chiara', age: 23, avatar: avatar('Chiara'), instagram: '@chiara.lodi', verified: true },
  matteo: { id: 'demo_10', name: 'Matteo', age: 25, avatar: avatar('Matteo'), instagram: '@matteo.c', verified: false },
  federica: { id: 'demo_11', name: 'Federica', age: 24, avatar: avatar('Federica'), instagram: '@fede24', verified: true },
  ale: { id: 'demo_12', name: 'Alessandro', age: 26, avatar: avatar('Alessandro'), instagram: '@ale.lodigiano', verified: true },
} satisfies Record<string, Member>;

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp_14', creatorId: USERS.alessio.id, category: 'CENA', name: 'Pizza del sabato a Lodi',
    description: 'Cena easy, niente tavolone infinito: pizza, chiacchiere e nuove conoscenze.', vibe: 'Easy & social', ageRange: '20–30',
    minCapacity: 5, capacity: 8, members: [USERS.alessio, USERS.giulia, USERS.marco, USERS.sara, USERS.luca], bookingStatus: 'BOOKED',
    selectedVenue: VENUES[0], selectedDate: '2026-09-12T20:30:00+02:00', code: 'C024', checkedInUserIds: [],
    messages: [
      { id: 'm1', senderId: USERS.giulia.id, sender: 'Giulia', text: 'Ottimo, così ognuno prende quello che preferisce dal menu 🍕', time: '14:20' },
      { id: 'm2', senderId: USERS.marco.id, sender: 'Marco', text: 'Confermato per sabato sera ragazzi!', time: '14:25' },
    ],
    createdAt: '2026-09-05T10:00:00+02:00',
  },
  {
    id: 'grp_08', creatorId: USERS.simone.id, category: 'SPORT', sport: 'Padel', name: 'Padel livello easy/intermedio',
    description: 'Partita senza agonismo esasperato. L’obiettivo è giocare e conoscere gente nuova.', vibe: 'Sport & relaxed', ageRange: '20–35',
    minCapacity: 4, capacity: 4, members: [USERS.simone, USERS.elena, USERS.davide], bookingStatus: 'OPEN',
    selectedVenue: VENUES[5], selectedDate: '2026-09-12T15:00:00+02:00', code: 'P012', checkedInUserIds: [],
    messages: [{ id: 'm3', senderId: USERS.simone.id, sender: 'Simone', text: 'Manca una persona e siamo pronti!', time: 'Ieri' }],
    createdAt: '2026-09-06T09:00:00+02:00',
  },
  {
    id: 'grp_21', creatorId: USERS.chiara.id, category: 'APERITIVO', name: 'Aperitivo in centro dopo lavoro',
    description: 'Un drink tranquillo in centro, gruppo piccolo e atmosfera informale.', vibe: 'Chill', ageRange: '21–30',
    minCapacity: 5, capacity: 7, members: [USERS.chiara, USERS.matteo, USERS.federica, USERS.ale], bookingStatus: 'OPEN',
    selectedVenue: VENUES[3], selectedDate: '2026-09-11T19:30:00+02:00', code: 'A117', checkedInUserIds: [], messages: [],
    createdAt: '2026-09-04T16:00:00+02:00',
  },
  {
    id: 'grp_32', creatorId: USERS.federica.id, category: 'CENA', name: 'Burger & nuove conoscenze',
    description: 'Cena informale per chi vuole uscire dal solito giro e conoscere persone nuove.', vibe: 'Social', ageRange: '20–30',
    minCapacity: 4, capacity: 6, members: [USERS.federica, USERS.matteo, USERS.chiara], bookingStatus: 'OPEN',
    selectedVenue: VENUES[1], selectedDate: '2026-09-18T20:45:00+02:00', code: 'C164', checkedInUserIds: [], messages: [],
    createdAt: '2026-09-07T13:00:00+02:00',
  },
  {
    id: 'grp_40', creatorId: USERS.ale.id, category: 'SPORT', sport: 'Calcetto', name: 'Calcetto 5vs5 del mercoledì',
    description: 'Livello amatoriale, squadre bilanciate e terzo tempo facoltativo dopo la partita.', vibe: 'Competitivo il giusto', ageRange: '20–35',
    minCapacity: 10, capacity: 10, members: [USERS.ale, USERS.matteo, USERS.marco, USERS.luca, USERS.davide, USERS.simone, USERS.chiara, USERS.federica], bookingStatus: 'OPEN',
    selectedVenue: VENUES[6], selectedDate: '2026-09-16T21:00:00+02:00', code: 'S208', checkedInUserIds: [], messages: [],
    createdAt: '2026-09-03T19:00:00+02:00',
  },
];

export const CATEGORY_META: Record<Category, { label: string; icon: string; description: string; accent: string; soft: string }> = {
  CENA: { label: 'Cena', icon: 'fa-utensils', description: 'Pizza, burger e tavoli social', accent: 'text-amber-700', soft: 'bg-amber-50' },
  APERITIVO: { label: 'Aperitivo', icon: 'fa-martini-glass-citrus', description: 'Drink e nuove conoscenze', accent: 'text-orange-700', soft: 'bg-orange-50' },
  SPORT: { label: 'Sport', icon: 'fa-futbol', description: 'Padel, calcetto e attività', accent: 'text-emerald-700', soft: 'bg-emerald-50' },
};

export const INITIAL_DRAFT: CreateDraft = {
  category: 'CENA', sport: 'Padel', name: '', date: '', description: '', vibe: 'Easy & social', ageRange: '20–30', venueId: 'v_1', minCapacity: 4, capacity: 8,
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  pushEventUpdates: true,
  pushChat: true,
  pushSuggestions: true,
  showInstagramAfterConfirm: true,
  showAge: true,
};

export const INTEREST_OPTIONS = ['aperitivi', 'cene', 'padel', 'calcetto', 'corsa', 'viaggi', 'cinema', 'musica', 'eventi', 'cucina'];

export const ADMIN_STATS = {
  usersRegistered: 842,
  usersActive: 610,
  newThisWeek: 45,
  groupsActive: 12,
  groupsCompleted: 88,
  totalRevenue: 2450.5,
  avgCommission: 2.35,
};
