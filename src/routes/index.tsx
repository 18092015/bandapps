import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askGemini, makeImage, startVideo, videoStatus } from "@/lib/ai.functions";
import logo from "@/assets/logo-b.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colband Hub — IA, Gravador e Moodle" },
      { name: "description", content: "Acesse IA (perguntas, imagem, vídeo), gravador e Moodle em um só lugar." },
      { property: "og:title", content: "Colband Hub — IA, Gravador e Moodle" },
      { property: "og:description", content: "Acesse IA, gravador e Moodle em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const MOODLE = "https://colbandcom.sharepoint.com/Pages/Colband.aspx";
const AI_TOOLS = {
  perguntas: { label: "Perguntas", hint: "Pergunte qualquer coisa ao Gemini..." },
  imagem: { label: "Imagem", url: "https://pt.vidnoz.com/ia-gerador-de-imagens-gratis.html" },
  video: { label: "Vídeo", url: "https://loremotion.com/generate" },
} as const;

function AiPanel({ kind }: { kind: AiKey }) {
  const ask = useServerFn(askGemini);
  const img = useServerFn(makeImage);
  const vid = useServerFn(startVideo);
  const status = useServerFn(videoStatus);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [out, setOut] = useState<{ text?: string; img?: string; video?: string } | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setOut(null); setMsg("Gerando...");
    try {
      if (kind === "perguntas") setOut({ text: (await ask({ data: { prompt: text } })).text });
      else if (kind === "imagem") setOut({ img: (await img({ data: { prompt: text } })).src });
      else {
        const { id } = await vid({ data: { prompt: text } });
        for (;;) {
          await new Promise((r) => setTimeout(r, 5000));
          const s = await status({ data: { id } });
          if (s.status === "failed") throw new Error(s.error ?? "Falha ao gerar vídeo.");
          if (s.status === "completed") { setOut({ video: `/api/public/video/${id}` }); break; }
          setMsg(`Gerando vídeo... ${Math.round(s.progress)}%`);
        }
      }
      setMsg("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Algo deu errado.");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      <form onSubmit={go} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={AI_TOOLS.perguntas.hint}
          className="flex-1 rounded-xl border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button disabled={busy} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "..." : "Enviar"}
        </button>
      </form>
      <div className="flex-1 overflow-auto rounded-xl border bg-card p-4">
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        {out?.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{out.text}</p>}
        {out?.img && <img src={out.img} alt={text} className="mx-auto max-h-[60vh] rounded-lg" />}
        {out?.video && <video src={out.video} controls autoPlay className="mx-auto max-h-[60vh] rounded-lg" />}
        {!msg && !out && <p className="text-sm text-muted-foreground">A resposta aparece aqui.</p>}
      </div>
    </div>
  );
}
type AiKey = keyof typeof AI_TOOLS;
type Section = "ia" | "gravador";

function Frame({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex flex-1 flex-col gap-2 min-h-0">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">Se não carregar aqui, o site bloqueia incorporação.</span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-secondary px-3 py-1.5 font-semibold text-secondary-foreground hover:bg-accent">
          Abrir em nova aba ↗
        </a>
      </div>
      <iframe key={url} src={url} title={title}
        className="flex-1 w-full rounded-xl border bg-card min-h-[60vh]"
        allow="camera; microphone; clipboard-write; autoplay; fullscreen" />
    </div>
  );
}

function Index() {
  const [section, setSection] = useState<Section>("ia");
  const [ai, setAi] = useState<AiKey>("perguntas");

  const navBtn = (active: boolean) =>
    `flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background">
      <aside className="order-2 md:order-1 flex md:flex-col items-center justify-around md:justify-start gap-2 border-t md:border-t-0 md:border-r bg-card p-2 md:w-24 md:py-4">
        <img src={logo.url} alt="Logo Colband" className="hidden md:block h-12 w-12 object-contain mb-4" />
        <button className={navBtn(section === "ia")} onClick={() => setSection("ia")}>
          <span className="text-lg">✦</span>IA
        </button>
        <button className={navBtn(section === "gravador")} onClick={() => setSection("gravador")}>
          <span className="text-lg">●</span>Gravador
        </button>
        <a className={navBtn(false)} href={MOODLE} target="_blank" rel="noopener noreferrer">
          <span className="text-lg">↗</span>Moodle
        </a>
      </aside>

      <main className="order-1 md:order-2 flex flex-1 flex-col gap-4 p-4 min-h-0">
        <header className="flex items-center gap-3">
          <img src={logo.url} alt="" className="md:hidden h-9 w-9 object-contain" />
          <h1 className="text-xl font-bold">{section === "ia" ? "Inteligência Artificial" : "Gravador"}</h1>
        </header>

        {section === "ia" ? (
          <>
            <div className="flex gap-2">
              {(Object.keys(AI_TOOLS) as AiKey[]).map((k) => (
                <button key={k} onClick={() => setAi(k)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    ai === k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}>
                  {AI_TOOLS[k].label}
                </button>
              ))}
            </div>
            {ai === "perguntas" ? (
              <AiPanel key={ai} kind={ai} />
            ) : (
              <Frame key={ai} url={AI_TOOLS[ai].url} title={AI_TOOLS[ai].label} />
            )}
          </>
        ) : (
          <Frame url="https://gravacaofake.lovable.app/" title="Gravador" />
        )}
      </main>
    </div>
  );
}
