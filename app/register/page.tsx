import Link from 'next/link';
import AuthFrame from '../_components/AuthFrame';
import { safeRedirect } from '../_components/authUtils';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string | string[] }> }) {
  const params = await searchParams;
  const redirectUrl = safeRedirect(params.redirect_url);
  const query = `?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthFrame eyebrow="Registrazione" title="Che account vuoi creare?" description="La registrazione utente è veloce. Per i locali raccogliamo invece i dati dell’attività e la richiesta viene verificata.">
      <div className="space-y-3">
        <Link href={`/sign-up/user${query}`} className="flex min-h-24 items-center gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-md">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-xl text-[#E63946]"><i className="fa-solid fa-user-plus" /></span>
          <span className="min-w-0 flex-1"><span className="block text-base font-black text-slate-950">Crea account utente</span><span className="mt-1 block text-xs leading-5 text-slate-500">Per conoscere persone e partecipare agli eventi.</span></span>
          <i className="fa-solid fa-chevron-right text-xs text-slate-300" />
        </Link>

        <Link href="/sign-up/venue" className="flex min-h-24 items-center gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl text-white"><i className="fa-solid fa-shop" /></span>
          <span className="min-w-0 flex-1"><span className="block text-base font-black text-slate-950">Registra un locale</span><span className="mt-1 block text-xs leading-5 text-slate-500">Ristorante, bar o centro sportivo partner.</span></span>
          <i className="fa-solid fa-chevron-right text-xs text-slate-300" />
        </Link>
      </div>

      <p className="mt-6 text-center text-[11px] text-slate-400">Hai già un account? <Link href={`/access${query}`} className="font-black text-[#E63946]">Accedi</Link></p>
    </AuthFrame>
  );
}
