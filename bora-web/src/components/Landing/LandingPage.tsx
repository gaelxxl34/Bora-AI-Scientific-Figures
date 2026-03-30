import { useState } from "react";
import { Link } from "react-router-dom";

/* ── Prompt examples that cycle in the hero input ── */
const promptExamples = [
  "EGFR signaling pathway with receptor, adaptor proteins, and downstream kinases",
  "CRISPR-Cas9 gene editing mechanism with guide RNA and target DNA",
  "Cell membrane cross-section showing lipid bilayer and transport proteins",
  "Western blot experimental workflow from lysate to imaging",
  "Mitochondrial electron transport chain with complexes I–IV",
];

export function LandingPage() {
  const [promptIdx, setPromptIdx] = useState(0);
  const nextPrompt = () => setPromptIdx((i) => (i + 1) % promptExamples.length);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-24">
          <img
            src="/img/Bora AI.png"
            alt="Bora — AI Scientific Figures"
            className="h-20 w-auto"
          />
          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-[13px] font-medium text-slate hover:text-ink-black transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[13px] font-medium text-slate hover:text-ink-black transition-colors">
              How It Works
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-[13px] font-medium text-slate hover:text-ink-black transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-ink-black text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-ink-black/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-36 pb-24 px-6 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-bora-blue/[0.03] via-transparent to-transparent" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-[56px] font-bold text-ink-black leading-[1.1] tracking-tight">
            Describe your figure.
            <br />
            <span className="text-bora-blue">AI builds it.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate max-w-xl mx-auto leading-relaxed">
            Turn plain-language prompts into publication-ready scientific figures
            with 10,000+ open-source icons.
          </p>

          {/* ── Interactive prompt bar (FigureLabs-style) ── */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="flex items-center bg-lab-white border border-border-gray rounded-2xl px-5 py-4 shadow-lg shadow-ink-black/[0.04] hover:shadow-xl hover:shadow-ink-black/[0.06] transition-shadow">
                <svg className="w-5 h-5 text-bora-blue shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                <button
                  type="button"
                  onClick={nextPrompt}
                  className="flex-1 text-left text-sm sm:text-base text-slate/60 truncate cursor-pointer"
                >
                  {promptExamples[promptIdx]}
                </button>
                <Link
                  to="/app"
                  className="shrink-0 ml-3 bg-bora-blue text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-bora-blue/90 transition-colors"
                >
                  Generate
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate/50 text-center">
                Click the prompt to see more examples &middot; No sign-up required
              </p>
            </div>
          </div>
        </div>

        {/* ── App Preview (BioRender-style product shot) ── */}
        <div className="relative mt-16 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border-gray bg-white shadow-2xl shadow-ink-black/[0.08] overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-lab-white/80 border-b border-border-gray">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-[11px] text-slate/50 ml-3 font-mono">bora.app — untitled figure</span>
            </div>
            {/* Three-panel layout mockup */}
            <div className="flex h-72 sm:h-[360px]">
              {/* Left sidebar */}
              <div className="w-48 border-r border-border-gray bg-lab-white/50 p-4 hidden sm:block">
                <div className="text-[10px] font-semibold text-slate/40 uppercase tracking-wider mb-3">Icon Library</div>
                <div className="space-y-2">
                  {["Cell", "Receptor", "Protein", "DNA", "Membrane"].map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-bora-blue-light" />
                      <span className="text-[11px] text-slate/50">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Center canvas */}
              <div className="flex-1 flex items-center justify-center bg-white relative">
                {/* Grid dots */}
                <div className="absolute inset-0" style={{
                  backgroundImage: "radial-gradient(circle, #e2e6ef 0.8px, transparent 0.8px)",
                  backgroundSize: "24px 24px",
                }} />
                <div className="relative text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-bora-blue/10 to-science-teal/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-bora-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <p className="text-[12px] text-slate/40">Your figure appears here</p>
                </div>
              </div>
              {/* Right chat */}
              <div className="w-56 border-l border-border-gray bg-lab-white/50 p-4 hidden md:flex flex-col">
                <div className="text-[10px] font-semibold text-slate/40 uppercase tracking-wider mb-3">AI Chat</div>
                <div className="flex-1 space-y-2">
                  <div className="bg-white rounded-lg px-3 py-2 text-[11px] text-slate/50 border border-border-gray">
                    Create an EGFR signaling pathway…
                  </div>
                  <div className="bg-bora-blue/5 rounded-lg px-3 py-2 text-[11px] text-bora-blue/40 border border-bora-blue/10">
                    Generating figure with 6 components…
                  </div>
                </div>
                <div className="mt-auto pt-2">
                  <div className="bg-white rounded-lg px-3 py-2 text-[11px] text-slate/30 border border-border-gray">
                    Describe changes…
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating glow */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-bora-blue/[0.06] blur-3xl rounded-full" />
        </div>
      </section>

      {/* ── Trusted By ── */}
      <section className="py-12 px-6 border-y border-border-gray bg-lab-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-semibold text-slate/40 uppercase tracking-widest mb-6">
            Built for researchers at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-slate/25">
            {["MIT", "Stanford", "Johns Hopkins", "Max Planck", "ETH Zurich", "UCL"].map((uni) => (
              <span key={uni} className="text-sm font-semibold tracking-wide">{uni}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-bora-blue uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-black tracking-tight">
              Everything you need, nothing you don't
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border-gray rounded-2xl overflow-hidden border border-border-gray">
            {[
              {
                title: "AI Generation",
                desc: "Describe in plain language. Claude produces publication-ready SVG figures instantly.",
                icon: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
              },
              {
                title: "10K+ Icons",
                desc: "BioIcons, Servier, SciDraw — semantically searchable, drag and drop.",
                icon: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
              },
              {
                title: "Publication Export",
                desc: "SVG, PNG at 300 DPI, or PDF. Formatted for Nature, Cell, Science.",
                icon: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3",
              },
              {
                title: "Iterative Refinement",
                desc: "Chat to refine. Bora preserves your canvas and changes only what you ask.",
                icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182",
              },
              {
                title: "Canvas Editing",
                desc: "Drag, resize, recolor every element. Full control on a real vector canvas.",
                icon: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125",
              },
              {
                title: "Open License",
                desc: "Every icon is CC0 or CC-BY. Full attribution included. Zero lock-in.",
                icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white p-7 hover:bg-lab-white transition-colors">
                <svg className="w-5 h-5 text-bora-blue mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
                <h3 className="font-semibold text-ink-black text-[15px] mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-slate leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-lab-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-science-teal uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-black tracking-tight">
              Describe &rarr; Generate &rarr; Publish
            </h2>
          </div>

          <div className="space-y-0">
            {[
              { n: "1", title: "Describe", text: "Type what you need in plain English — or any language." },
              { n: "2", title: "Generate", text: "AI creates a structured SVG with proper icons, labels, and layout." },
              { n: "3", title: "Refine", text: "Edit on canvas or chat: \"make arrows thicker, add a legend.\"" },
              { n: "4", title: "Export", text: "Download SVG, PNG (300 DPI), or PDF. Ready for submission." },
            ].map((s, i) => (
              <div key={s.n} className="flex items-start gap-5 py-6 group">
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-bora-blue text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {s.n}
                  </div>
                  {i < 3 && <div className="w-px h-full bg-border-gray absolute top-9" />}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-semibold text-ink-black text-[15px]">{s.title}</h3>
                  <p className="text-[13px] text-slate mt-0.5">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/img/Bora AI.png" alt="Bora" style={{ width: 220 }} className="mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-black tracking-tight">
            Start creating better figures
          </h2>
          <p className="mt-4 text-slate max-w-md mx-auto">
            Free to use. No credit card. No watermarks on SVG export.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 bg-ink-black text-white font-medium px-8 py-3.5 rounded-xl text-[15px] hover:bg-ink-black/90 transition-colors"
          >
            Open Bora
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border-gray py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/img/Bora AI.png" alt="Bora" style={{ width: 130 }} />
          <p className="text-[11px] text-slate/50">
            © {new Date().getFullYear()} Bora. Icons via BioIcons, Servier Medical Art & SciDraw (CC-BY / CC0).
          </p>
        </div>
      </footer>
    </div>
  );
}
