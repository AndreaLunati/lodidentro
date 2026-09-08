import Link from 'next/link';
import AuthFrame from '../_components/AuthFrame';
import { safeRedirect } from '../_components/authUtils';

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string | string[] }> }) {
  const params = await searchParams;
  const redirectUrl = safeRedirect(params.redirect_url);
  const query = `?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthFrame eyebrow="Accesso" title="Come vuoi entrare?" description="Utenti e locali hanno esperienze separate. Scegli il tipo di account con cui vuoi accedere.">
      <div className="space-y-3">
        <Link href={`/sign-in/user${query}`} className="flex min-h-24 items-center gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-md">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-xl text-[#E63946]"><i className="fa-solid fa-user" /></span>
          <span className="min-w-0 flex-1"><span className="block text-base font-black text-slate-950">Sono un utente</span><span className="mt-1 block text-xs leading-5 text-slate-500">Partecipa a cene, aperitivi, sport e gruppi locali.</span></span>
          <i className="fa-solid fa-chevron-right text-xs text-slate-300" />
        </Link>

        <Link href="/sign-in/venue" className="flex min-h-24 items-center gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl text-white"><i className="fa-solid fa-store" /></span>
          <span className="min-w-0 flex-1"><span className="block text-base font-black text-slate-950">Sono un locale</span><span className="mt-1 block text-xs leading-5 text-slate-500">Gestisci richieste, eventi, check-in e risultati del tuo locale.</span></span>
          <i className="fa-solid fa-chevron-right text-xs text-slate-300" />
        </Link>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-center">
        <p className="text-xs text-slate-500">Non hai ancora un account?</p>
        <Link href={`/register${query}`} className="mt-1 inline-block text-xs font-black text-[#E63946]">Registrati su Lodidentro</Link>
      </div>
    </AuthFrame>
  );
}
