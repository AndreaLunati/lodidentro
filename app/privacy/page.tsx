import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0f172a] sm:p-3 xl:p-6">
      <article className="h-dvh w-full min-w-0 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100%-1.5rem)] sm:max-w-[820px] xl:h-[900px] xl:max-w-[430px] overflow-y-auto bg-white p-5 shadow-2xl sm:max-h-[1024px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#1e293b] xl:max-h-[92vh] xl:rounded-[2.5rem] xl:border-[8px]">
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-extrabold text-slate-700">← Torna all’app</Link>
        <h1 className="mt-6 text-2xl font-black text-slate-950">Privacy</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Pagina placeholder da sostituire con l’informativa privacy definitiva prima della pubblicazione. Nel prototipo i dati sociali aggiuntivi vengono salvati localmente nel browser; Clerk gestisce l’autenticazione.</p>
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">Prima del lancio reale collega profili, partecipazioni, chat, segnalazioni e consensi al backend/Prisma e completa l’informativa legale.</div>
      </article>
    </main>
  );
}
