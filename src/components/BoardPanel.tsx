import { Button } from './ui';
import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";
import { CaptureUpdateAction, DefaultSidebar, Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { ArrowUpRight, Circle, Diamond, Eraser, Frame, Hand, ImagePlus, Lock, LockOpen, Maximize, Minus, MousePointer2, Pencil, Square, Type } from "./icons";
import "@excalidraw/excalidraw/index.css";
import "../board.css";
import { boardBackgroundMode, initialBoardBackground, THEME_BOARD_BACKGROUND, type BoardBackgroundMode } from '../lib/boardTheme';
import { adaptBoardHelp } from '../lib/boardShortcuts';

type ChangeHandler = NonNullable<ComponentProps<typeof Excalidraw>["onChange"]>;
type SceneElements = Parameters<ChangeHandler>[0];
type SceneAppState = Parameters<ChangeHandler>[1];
type SceneFiles = Parameters<ChangeHandler>[2];
type EditorAPI = Parameters<NonNullable<ComponentProps<typeof Excalidraw>["excalidrawAPI"]>>[0];
type ToolType = SceneAppState["activeTool"]["type"];

const boardUIOptions: ComponentProps<typeof Excalidraw>["UIOptions"] = {
  canvasActions: { toggleTheme: false, export: { saveFileToDisk: true } },
};
// A null renderer falls back to Excalidraw's iframe; a fragment does not.
const renderBoardEmbeddable = () => <></>;

type DrawingTool = { type: Exclude<ToolType, "custom">; label: string; shortcut: string; icon: typeof Pencil };
const drawingTools: DrawingTool[] = [
  { type: "selection", label: "Select", shortcut: "V", icon: MousePointer2 },
  { type: "hand", label: "Pan", shortcut: "H", icon: Hand },
  { type: "freedraw", label: "Draw", shortcut: "P", icon: Pencil },
  { type: "rectangle", label: "Rectangle", shortcut: "R", icon: Square },
  { type: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
  { type: "arrow", label: "Arrow", shortcut: "A", icon: ArrowUpRight },
  { type: "line", label: "Line", shortcut: "L", icon: Minus },
  { type: "text", label: "Text", shortcut: "T", icon: Type },
  { type: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
  { type: "diamond", label: "Diamond", shortcut: "D", icon: Diamond },
  { type: "image", label: "Image", shortcut: "9", icon: ImagePlus },
  { type: "frame", label: "Frame", shortcut: "F", icon: Frame },
];

function ToolButton({ tool, active, disabled, onSelect }: {
  tool: DrawingTool;
  active: boolean;
  disabled: boolean;
  onSelect: (type: DrawingTool["type"]) => void;
}) {
  const Icon = tool.icon;
  return <Button
    type="button"
    className={`board-tool board-tool--${tool.type}`}
    data-board-control=""
    aria-label={tool.label}
    aria-pressed={active}
    title={`${tool.label} (${tool.shortcut})${tool.type === "selection" ? " · Double-click or double-tap to type" : ""}`}
    disabled={disabled}
    onClick={() => onSelect(tool.type)}
  ><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></Button>;
}

/** The durable, JSON-serializable portion of an Excalidraw scene. */
export type BoardData = {
  elements: SceneElements;
  appState: Pick<SceneAppState, "viewBackgroundColor" | "scrollX" | "scrollY" | "zoom">;
  files: SceneFiles;
  backgroundMode?: BoardBackgroundMode;
};

type BoardPanelProps = {
  id: string;
  value: BoardData | null;
  theme: "light" | "dark";
  accent?: string;
  focus?: boolean;
  onChange: (value: BoardData) => void;
};

// Excalidraw otherwise loads fonts from its CDN. The host serves these files
// from public/fonts, including when the application has a non-root base URL.
(window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = import.meta.env.BASE_URL;

function BoardEditor({ value, theme, accent, focus = false, onChange }: Omit<BoardPanelProps, "id">) {
  // initialData is read once by Excalidraw. Keep it stable as the host saves.
  const [initialData] = useState(() => ({
    ...value,
    appState: { ...value?.appState, viewBackgroundColor: initialBoardBackground(value?.appState.viewBackgroundColor, value?.backgroundMode) },
  }));
  const lastSaved = useRef(value ? JSON.stringify(value) : "");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const engineRef = useRef<HTMLDivElement>(null);
  const clearDialogRef = useRef<HTMLDialogElement>(null);
  const clearDialogTitle = useId();
  const clearDialogDescription = useId();
  const [confirmClear, setConfirmClear] = useState(false);
  const [api, setApi] = useState<EditorAPI | null>(null);
  const [toolState, setToolState] = useState<{ type: ToolType; locked: boolean; editorHeight: number }>({ type: "selection", locked: false, editorHeight: 360 });

  const focusDrawing = useCallback(() => {
    engineRef.current?.querySelector<HTMLElement>(".excalidraw")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (confirmClear) clearDialogRef.current?.showModal();
    else clearDialogRef.current?.close();
  }, [confirmClear]);

  useEffect(() => {
    // Excalidraw mounts Help under body; its public API does not expose the
    // shortcut rows. Adapt only the two combinations owned by the workspace.
    const observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        const help = node.closest('.HelpDialog') ?? node.querySelector('.HelpDialog');
        if (help) adaptBoardHelp(help);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.excalidraw-modal-container .HelpDialog').forEach(adaptBoardHelp);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // The parent can change the editor's size when entering focus mode.
    const frame = requestAnimationFrame(() => {
      api?.refresh();
      if (focus) focusDrawing();
    });
    return () => cancelAnimationFrame(frame);
  }, [api, focus, focusDrawing]);

  const handleChange = useCallback<ChangeHandler>((elements, appState, files) => {
    const type = appState.activeTool.type;
    const locked = appState.activeTool.locked;
    const editorHeight = appState.height;
    setToolState((previous) => previous.type === type && previous.locked === locked && previous.editorHeight === editorHeight
      ? previous : { type, locked, editorHeight });
    const next: BoardData = {
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      },
      files,
      backgroundMode: boardBackgroundMode(appState.viewBackgroundColor),
    };
    const serialized = JSON.stringify(next);
    if (serialized !== lastSaved.current) {
      lastSaved.current = serialized;
      onChangeRef.current(next);
    }
  }, []);

  const selectTool = (type: DrawingTool["type"]) => {
    if (!api) return;
    api.setActiveTool({ type, locked: api.getAppState().activeTool.locked });
    focusDrawing();
  };

  const handleToolbarKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-board-control]"))
      .filter((control) => control.getClientRects().length > 0 && !control.hasAttribute("disabled"));
    const current = controls.indexOf(event.target as HTMLElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1
      : (current + (event.key === "ArrowRight" ? 1 : -1) + controls.length) % controls.length;
    controls[next]?.focus();
  };

  return (
    <div
      className={`board-panel h-full min-h-0 w-full overflow-hidden${focus ? " board-panel--focus" : ""}`}
      style={{ "--board-accent": accent, "--board-editor-height": `${toolState.editorHeight}px` } as CSSProperties}
      aria-label="Whiteboard"
    >
      <div className="board-drawing-toolbar">
        <div className="board-drawing-tools" role="toolbar" aria-label="Drawing tools" onKeyDown={handleToolbarKeys}>
          {drawingTools.map((tool) => <ToolButton key={tool.type} tool={tool} active={toolState.type === tool.type} disabled={!api} onSelect={selectTool} />)}
          <span className="board-tool-divider" aria-hidden="true" />
          <Button type="button" className="board-tool" data-board-control="" aria-label="Keep tool active" title="Keep tool active (Q)" aria-pressed={toolState.locked} disabled={!api} onClick={() => {
            if (!api) return;
            const active = api.getAppState().activeTool;
            if (active.type !== "custom") api.setActiveTool({ type: active.type, locked: !active.locked });
            focusDrawing();
          }}>{toolState.locked ? <Lock size={18} strokeWidth={1.7} aria-hidden="true" /> : <LockOpen size={18} strokeWidth={1.7} aria-hidden="true" />}</Button>
          <Button type="button" className="board-tool" data-board-control="" aria-label="Fit drawing" title="Fit drawing" disabled={!api} onClick={() => {
            api?.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85, animate: false });
            focusDrawing();
          }}><Maximize size={18} strokeWidth={1.7} aria-hidden="true" /></Button>
        </div>
      </div>
      <div ref={engineRef} className="board-engine" style={{ background: 'var(--canvas-bg)' }}>
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={initialData}
          onChange={handleChange}
          theme={theme}
          isCollaborating={false}
          zenModeEnabled={focus}
          autoFocus
          aiEnabled={false}
          validateEmbeddable={false}
          renderEmbeddable={renderBoardEmbeddable}
          UIOptions={boardUIOptions}
        >
          <WelcomeScreen><></></WelcomeScreen>
          <DefaultSidebar.Trigger style={{ display: "none" }} />
          <MainMenu>
            <MainMenu.DefaultItems.LoadScene />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.Separator />
            <MainMenu.Item onSelect={() => setConfirmClear(true)}>Clear canvas</MainMenu.Item>
            <MainMenu.DefaultItems.ChangeCanvasBackground />
            <MainMenu.Item onSelect={() => api?.updateScene({ appState: { viewBackgroundColor: THEME_BOARD_BACKGROUND }, captureUpdate: CaptureUpdateAction.IMMEDIATELY })}>Use theme background</MainMenu.Item>
            <MainMenu.Separator />
            <MainMenu.DefaultItems.Help />
          </MainMenu>
        </Excalidraw>
      </div>
      <dialog ref={clearDialogRef} className="canvas-dialog" aria-labelledby={clearDialogTitle} aria-describedby={clearDialogDescription} onCancel={() => setConfirmClear(false)} onClose={() => {
        setConfirmClear(false);
        engineRef.current?.querySelector<HTMLElement>(".main-menu-trigger")?.focus();
      }}>
        <h2 id={clearDialogTitle}>Clear this board?</h2>
        <p id={clearDialogDescription}>This removes all drawings from the board. You can undo this action.</p>
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            api?.updateScene({ elements: [], appState: { selectedElementIds: {} }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
            setConfirmClear(false);
          }}>Clear canvas</Button>
        </div>
      </dialog>
    </div>
  );
}

export default function BoardPanel({ id, ...props }: BoardPanelProps) {
  return <BoardEditor key={id} {...props} />;
}
