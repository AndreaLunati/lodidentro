import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthFrame({
  eyebrow,
  title,
  description,
  children,
  backHref = '/',
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
}) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#0f172a] sm:p-3 xl:p-6">
      <section className="relative flex h-dvh w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto bg-slate-50 shadow-2xl sm:h-[calc(100dvh-1.5rem)] sm:max-h-[1024px] sm:w-[calc(100%-1.5rem)] sm:max-w-[820px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#1e293b] xl:h-[900px] xl:max-h-[92vh] xl:max-w-[430px] xl:rounded-[2.5rem] xl:border-[8px]">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-xl sm:px-6 xl:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E63946] text-base font-black text-white shadow-md shadow-red-200">L</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black leading-none tracking-tight text-slate-950">LODIDENTRO</span>
              <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#E63946]">social</span>
            </span>
          </Link>
          <Link href={backHref} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Indietro">
            <i className="fa-solid fa-arrow-left text-xs" />
          </Link>
        </header>

        <div className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 xl:px-5">
          <div className="mx-auto w-full min-w-0 max-w-[620px]">
            <div className="mb-5 rounded-[28px] bg-[#1D3557] p-5 text-white shadow-xl sm:p-6 xl:p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-red-200">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl xl:text-2xl">{title}</h1>
              <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6 xl:text-xs xl:leading-5">{description}</p>
            </div>
            <div className="min-w-0 overflow-x-hidden">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
