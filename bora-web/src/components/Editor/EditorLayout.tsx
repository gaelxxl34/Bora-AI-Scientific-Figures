import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { EditorToolRail } from "./EditorToolRail";
import { EditorSidePanel } from "./EditorSidePanel";
import { EditorCanvas, type CanvasHandle } from "./EditorCanvas";
import { EditorStatusBar } from "./EditorStatusBar";
import { ExportModal } from "./ExportModal";
import { figureStorage, type SavedFigure, type SavedChatMessage } from "../../services/figureStorage";
import type { Icon } from "../../types/icon.types";
import { templates, type Template } from "../../data/templates";
import { useUserStore } from "../../store/userStore";

type SidePanel = "search" | "text" | "shapes" | "templates" | "ai" | null;

interface PageData {
  id: number;
  label: string;
  json: string;
}

const EMPTY_CANVAS = JSON.stringify({ version: "5.3.0", objects: [], background: "#ffffff" });

function UserAvatar() {
  const user = useUserStore((s) => s.user);
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-bora-blue to-blue-600 text-white text-[10px] font-bold flex items-center justify-center ml-1">
      {initials}
    </div>
  );
}

export function EditorLayout() {
  const { figureId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activePanel, setActivePanel] = useState<SidePanel>("search");
  const [zoom, setZoom] = useState(100);
  const [title, setTitle] = useState("Untitled");
  const [objectCount, setObjectCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // The real figure ID (stable after creation)
  const [realId, setRealId] = useState<string | null>(null);

  // Multi-page state
  const [pages, setPages] = useState<PageData[]>([
    { id: 1, label: "Page 1", json: EMPTY_CANVAS },
  ]);
  const [currentPage, setCurrentPage] = useState(1);

  const canvasRef = useRef<CanvasHandle>(null);
  const [showExport, setShowExport] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);
  const triggerAutoSaveRef = useRef<(() => void) | null>(null);

  // Chat messages state (persisted per figure)
  const [chatMessages, setChatMessages] = useState<SavedChatMessage[]>([]);

  /* ── Load figure on mount ── */
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (figureId && figureId !== "new") {
      const saved = figureStorage.get(figureId);
      if (saved) {
        setRealId(saved.id);
        setTitle(saved.title);
        setPages(saved.pages);
        setCurrentPage(saved.pages[0]?.id ?? 1);
        if (saved.chatMessages) setChatMessages(saved.chatMessages);

        // Check for a template to apply (from Dashboard "Use Template")
        const templateId = searchParams.get("template");
        if (templateId) {
          const tmpl = templates.find((t) => t.id === templateId);
          if (tmpl) {
            setTimeout(async () => {
              if (!canvasRef.current) return;
              await canvasRef.current.applyTemplate(tmpl);
              const json = canvasRef.current.getCanvasJSON();
              setPages([{ id: 1, label: "Page 1", json }]);
              setCurrentPage(1);
              triggerAutoSaveRef.current?.();
            }, 150);
            return;
          }
        }

        // Load first page onto canvas after mount
        setTimeout(() => {
          canvasRef.current?.loadCanvasJSON(saved.pages[0]?.json ?? EMPTY_CANVAS);
        }, 100);
        return;
      }
    }
    // New figure — create and redirect to real ID
    const created = figureStorage.create("Untitled");
    setRealId(created.id);
    navigate(`/app/editor/${created.id}`, { replace: true });
  }, [figureId, navigate, searchParams]);

  /* ── Persist helper ── */
  const persistNow = useCallback(() => {
    if (!realId || !canvasRef.current) return;
    setSaveStatus("saving");

    // Get current canvas JSON for current page
    const currentJson = canvasRef.current.getCanvasJSON();
    const updatedPages = pages.map((p) =>
      p.id === currentPage ? { ...p, json: currentJson } : p
    );

    // Generate small thumbnail
    const thumbnail = canvasRef.current.exportPNG(0.2);

    const figure: SavedFigure = {
      id: realId,
      title,
      pages: updatedPages,
      chatMessages,
      thumbnail,
      createdAt: figureStorage.get(realId)?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    figureStorage.save(figure);
    setSaveStatus("saved");
  }, [realId, title, pages, currentPage, chatMessages]);

  /* ── Auto-save: debounced on canvas changes ── */
  const triggerAutoSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistNow(), 1500);
  }, [persistNow]);
  triggerAutoSaveRef.current = triggerAutoSave;

  const handleChatMessagesChange = useCallback((msgs: { role: string; content: string }[]) => {
    setChatMessages(msgs as SavedChatMessage[]);
    triggerAutoSave();
  }, [triggerAutoSave]);

  /* ── Save on title change ── */
  useEffect(() => {
    if (!realId) return;
    triggerAutoSave();
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Ctrl/Cmd+S → force save, Ctrl/Cmd+E → export, Escape → close ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        persistNow();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setShowExport(true);
      }
      if (e.key === "Escape" && showExport) {
        setShowExport(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showExport, persistNow]);

  const togglePanel = (panel: SidePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleAddText = useCallback((preset: "heading" | "subheading" | "body" | "label") => {
    canvasRef.current?.addText(preset);
  }, []);

  const handleAddShape = useCallback((shape: string) => {
    canvasRef.current?.addShape(shape);
  }, []);

  const handleAddIcon = useCallback((icon: Icon) => {
    if (icon.svg_content) {
      canvasRef.current?.addIcon(icon.svg_content, icon.name);
    }
  }, []);

  const handleApplyTemplate = useCallback(async (template: Template) => {
    if (!canvasRef.current) return;
    await canvasRef.current.applyTemplate(template);
    // Snapshot the built canvas as page 1 JSON
    const json = canvasRef.current.getCanvasJSON();
    setTitle(template.title);
    setPages([{ id: 1, label: "Page 1", json }]);
    setCurrentPage(1);
    setActivePanel(null);
    triggerAutoSave();
  }, [triggerAutoSave]);

  /* ── Page management ── */
  const saveCurrentPage = useCallback(() => {
    if (!canvasRef.current) return;
    const json = canvasRef.current.getCanvasJSON();
    setPages((prev) =>
      prev.map((p) => (p.id === currentPage ? { ...p, json } : p))
    );
  }, [currentPage]);

  const switchToPage = useCallback((pageId: number) => {
    if (pageId === currentPage) return;
    // Save current before switching
    saveCurrentPage();
    setCurrentPage(pageId);
    const target = pages.find((p) => p.id === pageId);
    if (target) {
      // Small delay to let state settle
      setTimeout(() => canvasRef.current?.loadCanvasJSON(target.json), 0);
    }
  }, [currentPage, pages, saveCurrentPage]);

  const addPage = useCallback(() => {
    saveCurrentPage();
    const newId = Math.max(...pages.map((p) => p.id)) + 1;
    const newPage: PageData = { id: newId, label: `Page ${newId}`, json: EMPTY_CANVAS };
    setPages((prev) => [...prev, newPage]);
    setCurrentPage(newId);
    setTimeout(() => canvasRef.current?.loadCanvasJSON(EMPTY_CANVAS), 0);
  }, [pages, saveCurrentPage]);

  const deletePage = useCallback((pageId: number) => {
    if (pages.length <= 1) return; // Keep at least one
    const remaining = pages.filter((p) => p.id !== pageId);
    // Renumber pages sequentially so Page 2 becomes Page 1, etc.
    const renumbered = remaining.map((p, i) => ({
      ...p,
      id: i + 1,
      label: `Page ${i + 1}`,
    }));
    setPages(renumbered);
    if (currentPage === pageId) {
      const next = renumbered[0];
      setCurrentPage(next.id);
      setTimeout(() => canvasRef.current?.loadCanvasJSON(next.json), 0);
    } else {
      // Find what the current page's new ID is after renumbering
      const oldIndex = pages.findIndex((p) => p.id === currentPage);
      const deletedIndex = pages.findIndex((p) => p.id === pageId);
      const newIndex = oldIndex > deletedIndex ? oldIndex - 1 : oldIndex;
      setCurrentPage(renumbered[newIndex]?.id ?? renumbered[0].id);
    }
    triggerAutoSave();
  }, [pages, currentPage, triggerAutoSave]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-lab-white">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between h-14 px-3 bg-white border-b border-border-gray shrink-0">
        <div className="flex items-center gap-2">
          <Link to="/app" className="flex items-center gap-2 text-slate hover:text-ink-black" title="Home">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>
          <img src="/img/Bora%20AI.png" alt="Bora" className="h-8 object-contain" />
          <div className="h-5 w-px bg-border-gray mx-1" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-sm font-medium text-ink-black border-none outline-none w-44 hover:bg-lab-white focus:bg-lab-white px-2 py-1 rounded"
          />
          <span className="text-[10px] text-slate/60 ml-1 select-none">
            {saveStatus === "saving" ? "Saving…" : saveStatus === "unsaved" ? "Unsaved" : "✓ Saved"}
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            <button onClick={() => canvasRef.current?.undo()} className="p-1.5 text-slate hover:text-ink-black rounded hover:bg-lab-white" title="Undo (⌘Z)">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </button>
            <button onClick={() => canvasRef.current?.redo()} className="p-1.5 text-slate hover:text-ink-black rounded hover:bg-lab-white" title="Redo (⌘⇧Z)">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="px-3 py-1.5 text-xs font-medium bg-bora-blue text-white rounded-lg hover:bg-bora-blue/90"
          >
            Export
          </button>
          <UserAvatar />
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Tool rail */}
        <EditorToolRail activePanel={activePanel} onToggle={togglePanel} />

        {/* Side panel (icons/templates/text/shapes/AI) */}
        {activePanel && (
          <EditorSidePanel
            panel={activePanel}
            onClose={() => setActivePanel(null)}
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onAddIcon={handleAddIcon}
            onApplyTemplate={handleApplyTemplate}
            canvasContext={objectCount > 0 ? (canvasRef.current?.getCanvasDescription?.() ?? `${objectCount} objects on canvas titled "${title}"`) : null}
            canvasRef={canvasRef}
            onCanvasChanged={triggerAutoSave}
            initialChatMessages={chatMessages}
            onChatMessagesChange={handleChatMessagesChange}
          />
        )}

        {/* Canvas */}
        <EditorCanvas
          ref={canvasRef}
          zoom={zoom}
          onObjectCountChange={(count) => {
            setObjectCount(count);
            triggerAutoSave();
          }}
        />
      </div>

      {/* ── Export Modal ── */}
      {showExport && (
        <ExportModal
          canvasRef={canvasRef}
          title={title}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Status Bar with Pages ── */}
      <EditorStatusBar
        zoom={zoom}
        onZoomChange={setZoom}
        objectCount={objectCount}
        pages={pages}
        currentPage={currentPage}
        onSwitchPage={switchToPage}
        onAddPage={addPage}
        onDeletePage={deletePage}
      />
    </div>
  );
}
