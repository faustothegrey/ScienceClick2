import Link from "next/link";
import { ArrowRight, Shapes, Tags, type LucideIcon } from "lucide-react";
import { SNAPIT_BASE } from "@/lib/snapitRoutes";

interface SubApp {
  name: string;
  href: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

// One card per sub-app. Add new sub-apps here.
const SUB_APPS: SubApp[] = [
  {
    name: "ObserveIt",
    href: "/observeit",
    description: "Osserva una scena, trova le forme e scrivi il loro nome. Pensato per la LIM.",
    icon: Shapes,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "SnapIt",
    href: `${SNAPIT_BASE}/scenes`,
    description: "Trascina le parole sull'immagine giusta per etichettare scene e diagrammi.",
    icon: Tags,
    accent: "bg-sky-100 text-sky-700",
  },
];

export default function Home() {
  return (
    <main lang="it" className="min-h-dvh bg-slate-50 text-slate-800 flex flex-col items-center px-4 py-12 sm:py-20">
      <header className="text-center max-w-xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">ScienceClick</h1>
        <p className="mt-3 text-lg text-slate-600">Attività interattive per imparare le scienze e l&apos;italiano.</p>
      </header>

      <ul className="mt-10 sm:mt-14 w-full max-w-3xl grid gap-5 sm:grid-cols-2">
        {SUB_APPS.map(({ name, href, description, icon: Icon, accent }) => (
          <li key={name}>
            <Link
              href={href}
              className="group h-full flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition"
            >
              <span className={`w-14 h-14 rounded-xl flex items-center justify-center ${accent}`}>
                <Icon className="w-8 h-8" />
              </span>
              <span className="text-2xl font-semibold">{name}</span>
              <span className="text-slate-600 leading-relaxed flex-1">{description}</span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                Apri <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
