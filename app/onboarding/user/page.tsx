import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AuthFrame from '../../_components/AuthFrame';
import { safeRedirect } from '../../_components/authUtils';
import { completeUserOnboarding } from '../../actions/account';

const interests = ['aperitivi', 'cene', 'padel', 'calcetto', 'corsa', 'viaggi', 'musica', 'cinema', 'cucina'];

export default async function UserOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string | string[]; redirect_url?: string | string[] }> }) {
  await auth.protect();
  const params = await searchParams;
  const user = await currentUser();
  const role = String(user?.publicMetadata?.role ?? '');
  if (role === 'VENUE') redirect('/locale');
  if (role === 'USER') redirect(safeRedirect(params.redirect_url));

  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const redirectUrl = safeRedirect(params.redirect_url);
  const defaultName = user?.fullName ?? user?.firstName ?? '';

  return (
    <AuthFrame eyebrow="Profilo utente" title="Dicci il minimo per partire." description="Questi dati servono per rendere i gruppi più chiari e adatti alle persone che partecipano." backHref="/">
      <form action={completeUserOnboarding} className="min-w-0 space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <input type="hidden" name="redirectUrl" value={redirectUrl} />
        {error && <div className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}

        <label className="block text-xs font-extrabold text-slate-700">Nome visibile<input name="displayName" defaultValue={defaultName} required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-extrabold text-slate-700">Età<input name="age" type="number" min="18" max="80" required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
          <label className="block text-xs font-extrabold text-slate-700">Città<input name="city" defaultValue="Lodi" required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>
        </div>
        <label className="block text-xs font-extrabold text-slate-700">Instagram <span className="font-medium text-slate-400">(facoltativo)</span><input name="instagram" placeholder="@username" className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#E63946]" /></label>

        <fieldset>
          <legend className="text-xs font-extrabold text-slate-700">Interessi</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {interests.map((item) => <label key={item} className="cursor-pointer"><input type="checkbox" name="interests" value={item} className="peer sr-only" /><span className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 peer-checked:border-[#E63946] peer-checked:bg-red-50 peer-checked:text-[#E63946]">{item}</span></label>)}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-500"><input type="checkbox" required className="mt-1" />Confermo di avere almeno 18 anni e di rispettare le regole della community Lodidentro.</label>
        <button className="min-h-12 w-full rounded-2xl bg-[#E63946] px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-100">Entra in Lodidentro</button>
      </form>
    </AuthFrame>
  );
}
