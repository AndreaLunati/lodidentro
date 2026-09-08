export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0f172a] sm:p-3 xl:p-6">
      <section className="grid h-dvh w-full min-w-0 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100%-1.5rem)] sm:max-w-[820px] xl:h-[900px] xl:max-w-[430px] place-items-center bg-white shadow-2xl sm:max-h-[1024px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#1e293b] xl:max-h-[92vh] xl:rounded-[2.5rem] xl:border-[8px]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#E63946]" aria-hidden="true" />
          <span className="text-sm font-extrabold text-slate-700">Caricamento Lodidentro…</span>
        </div>
      </section>
    </main>
  );
}
