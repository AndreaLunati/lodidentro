'use client';

import { SignOutButton, useUser } from '@clerk/nextjs';
import { useEffect, useMemo, useRef, useState } from 'react';

type VenueTab = 'home' | 'events' | 'checkin' | 'profile';
type VenueEventStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';

type VenueEvent = {
  id: string;
  title: string;
  date: string;
  participants: number;
  capacity: number;
  status: VenueEventStatus;
  code: string;
};

const DEMO_EVENTS: VenueEvent[] = [
  { id: 've1', title: 'Aperitivo dopo lavoro', date: '2026-09-10T19:30:00+02:00', participants: 7, capacity: 8, status: 'PENDING', code: 'A117' },
  { id: 've2', title: 'Drink & nuove conoscenze', date: '2026-09-12T20:00:00+02:00', participants: 6, capacity: 6, status: 'CONFIRMED', code: 'A204' },
  { id: 've3', title: 'Aperitivo easy del giovedì', date: '2026-09-17T19:00:00+02:00', participants: 4, capacity: 8, status: 'PENDING', code: 'A221' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function statusLabel(status: VenueEventStatus) {
  if (status === 'PENDING') return ['Da confermare', 'bg-amber-50 text-amber-700'];
  if (status === 'CONFIRMED') return ['Confermato', 'bg-emerald-50 text-emerald-700'];
  if (status === 'REJECTED') return ['Non disponibile', 'bg-red-50 text-red-700'];
  return ['Concluso', 'bg-slate-100 text-slate-600'];
}

export default function VenueApp() {
  const { isLoaded, user } = useUser();
  const scrollRef = useRef<HTMLElement | null>(null);
  const [tab, setTab] = useState<VenueTab>('home');
  const [events, setEvents] = useState<VenueEvent[]>(DEMO_EVENTS);
  const [checkedCodes, setCheckedCodes] = useState<string[]>([]);
  const [checkCode, setCheckCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem('lodidentro:v5:venue-events');
    if (raw) try { setEvents(JSON.parse(raw)); } catch {}
    const checks = window.localStorage.getItem('lodidentro:v5:venue-checkins');
    if (checks) try { setCheckedCodes(JSON.parse(checks)); } catch {}
  }, []);

  useEffect(() => { window.localStorage.setItem('lodidentro:v5:venue-events', JSON.stringify(events)); }, [events]);
  useEffect(() => { window.localStorage.setItem('lodidentro:v5:venue-checkins', JSON.stringify(checkedCodes)); }, [checkedCodes]);
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 2400); return () => window.clearTimeout(t); }, [toast]);

  const metadata = user?.unsafeMetadata ?? {};
  const publicMetadata = user?.publicMetadata ?? {};
  const venueName = String(metadata.venueName ?? 'Il tuo locale');
  const venueCity = String(metadata.venueCity ?? 'Lodi');
  const venueStatus = String(publicMetadata.venueStatus ?? 'PENDING');
  const pendingCount = events.filter((event) => event.status === 'PENDING').length;
  const confirmed = events.filter((event) => event.status === 'CONFIRMED');
  const expectedPeople = confirmed.reduce((sum, event) => sum + event.participants, 0);
  const nextEvent = [...events].filter((event) => event.status === 'CONFIRMED').sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];

  const setEventStatus = (id: string, status: VenueEventStatus) => {
    setEvents((items) => items.map((event) => event.id === id ? { ...event, status } : event));
    setToast(status === 'CONFIRMED' ? 'Evento confermato: gli utenti verranno avvisati.' : 'Richiesta aggiornata.');
  };

  const doCheckIn = () => {
    const code = checkCode.trim().toUpperCase();
    if (!code) return;
    const event = events.find((item) => item.code === code && item.status === 'CONFIRMED');
    if (!event) return setToast('Codice non valido o evento non confermato.');
    if (checkedCodes.includes(code)) return setToast('Questo codice risulta già convalidato.');
    setCheckedCodes((items) => [...items, code]);
    setCheckCode('');
    setToast(`Check-in ${code} registrato.`);
  };

  const nav: Array<[VenueTab, string, string]> = [['home', 'Home', 'fa-house'], ['events', 'Eventi', 'fa-calendar-days'], ['checkin', 'Check-in', 'fa-qrcode'], ['profile', 'Profilo', 'fa-store']];

  if (!isLoaded) return <div className="grid min-h-dvh place-items-center bg-[#0f172a] text-white">Caricamento…</div>;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0f172a] text-slate-950 sm:p-3 xl:p-6">
      <div className="relative flex h-dvh w-full min-w-0 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100%-1.5rem)] sm:max-w-[820px] xl:h-[900px] xl:max-w-[430px] flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[1024px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#1e293b] xl:max-h-[92vh] xl:rounded-[2.5rem] xl:border-[8px]">
        <header className="z-40 shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <button onClick={() => setTab('home')} className="flex items-center gap-2.5 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white"><i className="fa-solid fa-store text-sm" /></span>
              <span><span className="block max-w-[220px] truncate text-sm font-black leading-none">{venueName}</span><span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Lodidentro partner</span></span>
            </button>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${venueStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{venueStatus === 'APPROVED' ? 'ATTIVO' : 'IN VERIFICA'}</span>
          </div>
        </header>

        <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 pb-28">
          {tab === 'home' && <div className="space-y-5 px-4 py-5">
            {venueStatus !== 'APPROVED' && <section className="rounded-[26px] border border-amber-100 bg-amber-50 p-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-600"><i className="fa-solid fa-clock" /></span><div><h2 className="text-sm font-black text-amber-900">Profilo in verifica</h2><p className="mt-1 text-[11px] leading-5 text-amber-800">La dashboard è disponibile in anteprima. In produzione, conferme e pubblicazione eventi si attivano dopo l’approvazione Lodidentro.</p></div></div></section>}

            <section className="rounded-[30px] bg-slate-950 p-5 text-white shadow-xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Questa settimana</p><h1 className="mt-2 text-2xl font-black">Ciao, {venueName}</h1><p className="mt-2 text-xs leading-5 text-slate-400">Controlla richieste e persone attese dal tuo locale.</p><div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black">{confirmed.length}</p><p className="mt-1 text-[9px] text-slate-400">eventi confermati</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black">{expectedPeople}</p><p className="mt-1 text-[9px] text-slate-400">persone attese</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-black text-amber-300">{pendingCount}</p><p className="mt-1 text-[9px] text-slate-400">da gestire</p></div></div></section>

            {nextEvent && <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Prossimo evento</p><h2 className="mt-2 text-base font-black">{nextEvent.title}</h2><p className="mt-1 text-xs text-slate-500">{formatDate(nextEvent.date)}</p><div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span className="text-xs font-bold text-slate-600"><i className="fa-solid fa-users mr-2 text-slate-400" />{nextEvent.participants}/{nextEvent.capacity} partecipanti</span><span className="text-[10px] font-black text-emerald-600">CONFERMATO</span></div><button onClick={() => setTab('events')} className="mt-3 min-h-11 w-full rounded-2xl bg-[#E63946] text-xs font-black text-white">Apri eventi</button></section>}

            {pendingCount > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Richieste da confermare</h2><button onClick={() => setTab('events')} className="text-[10px] font-black text-[#E63946]">Vedi tutte</button></div>{events.filter((event) => event.status === 'PENDING').slice(0, 2).map((event) => <div key={event.id} className="mb-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-sm font-black">{event.title}</h3><p className="mt-1 text-[11px] text-slate-500">{formatDate(event.date)} · {event.participants} persone</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setEventStatus(event.id, 'REJECTED')} className="min-h-10 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600">Non disponibile</button><button onClick={() => setEventStatus(event.id, 'CONFIRMED')} className="min-h-10 rounded-xl bg-emerald-600 text-[10px] font-black text-white">Conferma</button></div></div>)}</section>}
          </div>}

          {tab === 'events' && <div className="px-4 py-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Agenda partner</p><h1 className="mt-1 text-2xl font-black">Eventi</h1><p className="mt-1 text-xs text-slate-500">Conferma le richieste quando il quorum è stato raggiunto.</p><div className="mt-5 space-y-3">{events.map((event) => { const [label, tone] = statusLabel(event.status); return <article key={event.id} className="rounded-[25px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-black">{event.title}</h2><p className="mt-1 text-[11px] text-slate-500">{formatDate(event.date)}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${tone}`}>{label}</span></div><div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-[11px]"><span className="font-bold text-slate-600"><i className="fa-solid fa-users mr-2" />{event.participants}/{event.capacity}</span><span className="font-black text-slate-900">{event.code}</span></div>{event.status === 'PENDING' && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setEventStatus(event.id, 'REJECTED')} className="min-h-10 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600">Rifiuta</button><button onClick={() => setEventStatus(event.id, 'CONFIRMED')} className="min-h-10 rounded-xl bg-emerald-600 text-[10px] font-black text-white">Conferma</button></div>}{event.status === 'CONFIRMED' && <button onClick={() => setEventStatus(event.id, 'COMPLETED')} className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 text-[10px] font-black text-slate-600">Segna concluso</button>}</article>; })}</div></div>}

          {tab === 'checkin' && <div className="px-4 py-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Presenze</p><h1 className="mt-1 text-2xl font-black">Check-in</h1><p className="mt-1 text-xs leading-5 text-slate-500">Inserisci il codice mostrato dall’utente per registrare una presenza verificata.</p><section className="mt-5 rounded-[28px] bg-slate-950 p-5 text-white shadow-xl"><label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Codice evento</label><input value={checkCode} onChange={(e) => setCheckCode(e.target.value.toUpperCase())} maxLength={8} placeholder="A204" className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-center text-2xl font-black tracking-[0.2em] text-white outline-none" /><button onClick={doCheckIn} className="mt-3 min-h-12 w-full rounded-2xl bg-[#E63946] text-sm font-black">Convalida presenza</button></section><section className="mt-5"><h2 className="text-sm font-black">Ultimi check-in</h2>{checkedCodes.length === 0 ? <p className="mt-4 rounded-2xl bg-white p-4 text-center text-xs text-slate-400">Nessun check-in registrato.</p> : <div className="mt-3 space-y-2">{[...checkedCodes].reverse().map((code) => <div key={code} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"><span className="text-xs font-black">{code}</span><span className="text-[10px] font-bold text-emerald-600"><i className="fa-solid fa-check mr-1" />Convalidato</span></div>)}</div>}</section></div>}

          {tab === 'profile' && <div className="px-4 py-5"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-950 text-2xl text-white"><i className="fa-solid fa-store" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E63946]">Profilo partner</p><h1 className="mt-1 text-xl font-black">{venueName}</h1><p className="mt-1 text-xs text-slate-500"><i className="fa-solid fa-location-dot mr-1" />{venueCity}</p></div></div></section><section className="mt-4 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">{[['Categoria', String(metadata.venueCategory ?? '—')], ['Email', String(metadata.venueEmail ?? user?.primaryEmailAddress?.emailAddress ?? '—')], ['Telefono', String(metadata.venuePhone ?? '—')], ['P.IVA', String(metadata.venueVatNumber ?? '—')]].map(([label, value], index) => <div key={label} className={`flex items-center justify-between gap-4 p-4 ${index ? 'border-t border-slate-100' : ''}`}><span className="text-xs font-bold text-slate-500">{label}</span><span className="max-w-[220px] truncate text-xs font-black text-slate-900">{value}</span></div>)}</section><div className="mt-4 rounded-[24px] bg-amber-50 p-4"><p className="text-xs font-black text-amber-900">Stato partnership: {venueStatus}</p><p className="mt-1 text-[10px] leading-5 text-amber-700">Solo Lodidentro dovrebbe poter cambiare questo stato in APPROVED dopo la verifica.</p></div><SignOutButton redirectUrl="/"><button className="mt-5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600">Esci dall’account</button></SignOutButton></div>}
        </main>

        <nav className="absolute inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="grid grid-cols-4 px-2">{nav.map(([value, label, icon]) => <button key={value} onClick={() => { setTab(value); scrollRef.current?.scrollTo({ top: 0 }); }} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold ${tab === value ? 'text-[#E63946]' : 'text-slate-400'}`}><i className={`fa-solid ${icon} text-base`} /><span>{label}</span>{value === 'events' && pendingCount > 0 && <span className="absolute" />}</button>)}</div></nav>
      </div>
      {toast && <div className="fixed left-1/2 top-4 z-[70] -translate-x-1/2 px-4"><div className="min-w-[280px] rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-2xl">{toast}</div></div>}
    </div>
  );
}
