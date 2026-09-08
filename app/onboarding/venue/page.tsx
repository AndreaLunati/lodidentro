import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AuthFrame from '../../_components/AuthFrame';
import { completeVenueOnboarding } from '../../actions/account';

export default async function VenueOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  await auth.protect();
  const params = await searchParams;
  const user = await currentUser();
  const role = String(user?.publicMetadata?.role ?? '');
  if (role === 'USER') redirect('/');
  if (role === 'VENUE') redirect('/locale');
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <AuthFrame eyebrow="Candidatura partner" title="Raccontaci il tuo locale." description="La registrazione business è separata da quella utente. Dopo l’invio, Lodidentro può verificare il profilo prima di attivarlo." backHref="/register">
      <form action={completeVenueOnboarding} className="min-w-0 space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {error && <div className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
        <label className="block text-xs font-extrabold text-slate-700">Nome attività<input name="venueName" required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        <label className="block text-xs font-extrabold text-slate-700">Categoria<select name="category" required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]"><option value="RESTAURANT">Ristorante / pizzeria</option><option value="BAR">Bar / cocktail bar</option><option value="SPORT_CENTER">Centro sportivo</option><option value="OTHER">Altro</option></select></label>
        <label className="block text-xs font-extrabold text-slate-700">Indirizzo<input name="address" required placeholder="Via, numero civico" className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        <label className="block text-xs font-extrabold text-slate-700">Città<input name="city" required defaultValue="Lodi" className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-xs font-extrabold text-slate-700">Telefono<input name="phone" type="tel" className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#E63946]" /></label><label className="block text-xs font-extrabold text-slate-700">P.IVA<input name="vatNumber" required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#E63946]" /></label></div>
        <label className="block text-xs font-extrabold text-slate-700">Email attività<input name="businessEmail" type="email" defaultValue={user?.primaryEmailAddress?.emailAddress ?? ''} required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        <label className="block text-xs font-extrabold text-slate-700">Referente<input name="contactName" defaultValue={user?.fullName ?? ''} required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-xs font-extrabold text-slate-700">Instagram<input name="instagram" placeholder="@locale" className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#E63946]" /></label><label className="block text-xs font-extrabold text-slate-700">Sito<input name="website" placeholder="https://" className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#E63946]" /></label></div>
        <label className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-500"><input type="checkbox" required className="mt-1" />Confermo di essere autorizzato a rappresentare l’attività e che i dati inseriti sono corretti.</label>
        <button className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Invia richiesta partner</button>
      </form>
    </AuthFrame>
  );
}
