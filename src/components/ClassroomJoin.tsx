"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Copy, QrCode, X } from "lucide-react";

type LinkOption = { url: string; label: string; qr: string };
export default function ClassroomJoin({ path = "/" }: { path?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const [links, setLinks] = useState<LinkOption[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [local, setLocal] = useState(true);
  const link = links[selected];
  async function open() {
    dialog.current?.showModal();
    setLoading(true); setError(""); setCopied(""); setLinks([]); setSelected(0);
    try {
      const response = await fetch(`/api/classroom?path=${encodeURIComponent(path)}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setLinks(data.links); setLocal(data.local);
      if (!data.links.length) setError("Nessuna rete trovata. Collega il computer al Wi-Fi e riprova.");
    } catch { setError("Non riesco a trovare l’indirizzo. Controlla la connessione e riprova."); }
    finally { setLoading(false); }
  }
  async function copy() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link.url); setCopied("Link copiato!"); }
    catch {
      // Clipboard API may be unavailable over HTTP on the classroom LAN.
      linkInput.current?.focus(); linkInput.current?.select();
      setCopied("Link selezionato: premi Ctrl+C (oppure ⌘C) per copiarlo.");
    }
  }
  return <>
    <button type="button" onClick={open} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"><QrCode size={19} />Invita la classe</button>
    <dialog ref={dialog} aria-label="Collega la classe" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }} className="m-auto max-h-[92dvh] w-[min(94vw,680px)] overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-xl backdrop:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Collega la classe</h2><button type="button" aria-label="Chiudi" onClick={() => dialog.current?.close()} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div>
      <p className="mt-3 text-lg">Apri questo indirizzo sul computer degli studenti oppure inquadra il QR code.</p>
      {loading && <p role="status" className="py-8">Cerco l’indirizzo…</p>}
      {error && <div role="alert" className="mt-5 rounded-xl bg-amber-50 p-4"><p>{error}</p><button type="button" onClick={open} className="mt-3 font-bold underline">Riprova</button></div>}
      {!loading && link && <>
        {links.length > 1 && <label className="mt-4 block text-sm font-semibold">Rete del computer<select className="mt-1 block w-full rounded-lg border border-slate-300 p-2" value={selected} onChange={e => { setSelected(Number(e.target.value)); setCopied(""); }}>{links.map((item, i) => <option key={item.url} value={i}>{item.label}</option>)}</select></label>}
        <div className="my-3 flex justify-center"><Image unoptimized src={link.qr} width={320} height={320} alt={`QR code per aprire ${link.url}`} className="h-auto w-[min(70vw,320px)]" /></div>
        <label className="text-sm font-semibold" htmlFor={`classroom-url-${path.replaceAll("/", "-")}`}>Indirizzo da aprire</label>
        <input ref={linkInput} id={`classroom-url-${path.replaceAll("/", "-")}`} readOnly value={link.url} onClick={e => e.currentTarget.select()} className="mt-2 w-full rounded-xl border-2 border-slate-300 bg-slate-50 p-3 text-center font-mono text-lg sm:text-2xl" />
        <button type="button" onClick={copy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"><Copy size={18} />Copia link</button>
        <p role="status" className="mt-2 min-h-5 text-center text-sm text-emerald-700">{copied}</p>
        {local && <p className="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-relaxed">Collega tutti i computer allo stesso Wi-Fi. Lascia acceso questo computer e tieni il server avviato. Se il link non si apre, controlla che la rete della scuola permetta la connessione tra dispositivi.</p>}
      </>}
    </dialog>
  </>;
}
