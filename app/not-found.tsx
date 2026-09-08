import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0f172a] sm:p-3 xl:p-6">
      <section className="grid h-dvh w-full min-w-0 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100%-1.5rem)] sm:max-w-[820px] xl:h-[900px] xl:max-w-[430px] place-items-center bg-slate-50 px-5 shadow-2xl sm:max-h-[1024px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#1e293b] xl:max-h-[92vh] xl:rounded-[2.5rem] xl:border-[8px]">
        <div className="w-full rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-xl">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-lg font-black text-slate-500">404</span>
          <h1 className="mt-4 text-xl font-black text-slate-950">Pagina non trovata</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Questa pagina non esiste oppure l'indirizzo non è più valido.</p>
          <Link href="/" className="mt-5 grid min-h-11 place-items-center rounded-2xl bg-[#E63946] px-4 py-3 text-sm font-black text-white hover:bg-[#D90429]">Torna a Lodidentro</Link>
        </div>
      </section>
    </main>
  );
}
