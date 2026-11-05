import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Monitor, Moon, RotateCcw, Sun } from './icons';
import { Button, ColorPicker, Input, Select, Switch } from './ui';
import {
  codeFonts, defaultAppearance, resolveAppearance, themePresets, uiFonts,
  type Appearance,
} from '../lib/themes';

type Props = { value: Appearance; onChange: (value: Appearance) => void; onClose: () => void };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="appearance-section"><h2>{title}</h2>{children}</section>;
}

export default function AppearancePanel({ value, onChange, onClose }: Props) {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const resolved = resolveAppearance(value, systemDark);
  const preset = themePresets.find(item => item.id === value.preset) ?? themePresets[0]!;
  const baseColors = preset.colors[resolved.mode];
  const update = (patch: Partial<Appearance>) => onChange({ ...value, ...patch });
  const setPreset = (id: string) => update({ preset: id, accent: null, background: null, foreground: null });

  return <div className="appearance-scroll">
    <div className="appearance-settings">
      <Button onClick={onClose} className="appearance-back"><ArrowLeft size={14} />Back to workspace</Button>
      <header className="appearance-header"><h1>Appearance</h1><Button variant="outline" onClick={() => onChange({ ...defaultAppearance })}><RotateCcw size={13} />Reset defaults</Button></header>
      <Section title="Mode">
        <div className="appearance-modes" role="group" aria-label="Color mode">
          {(['system', 'light', 'dark'] as const).map(mode => {
            const Icon = mode === 'system' ? Monitor : mode === 'light' ? Sun : Moon;
            return <Button key={mode} variant="outline" aria-pressed={value.mode === mode} onClick={() => update({ mode })}><Icon size={15} /><span>{mode}</span></Button>;
          })}
        </div>
      </Section>
      <Section title="Theme">
        <div className="appearance-row"><label htmlFor="theme-preset">Color palette</label><Select id="theme-preset" value={value.preset} onChange={event => setPreset(event.target.value)}>{themePresets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
        <div className="appearance-themes" role="group" aria-label="Theme presets">
          {themePresets.map(item => {
            const colors = item.colors[resolved.mode];
            const selected = item.id === value.preset;
            return <Button key={item.id} className="appearance-theme" aria-pressed={selected} aria-label={`${item.name} theme`} onClick={() => setPreset(item.id)}>
              <span className="appearance-theme-preview" style={{ background: colors.background, color: colors.foreground, borderColor: colors.border }}>
                <span className="appearance-theme-line" style={{ background: colors.foreground }} /><span className="appearance-theme-line" style={{ background: colors.muted }} /><span className="appearance-theme-dot" style={{ background: colors.accent }} />
                {selected && <Check size={12} className="appearance-theme-check" style={{ color: colors.accent }} />}
              </span><span className="appearance-theme-name">{item.name}</span>
            </Button>;
          })}
        </div>
      </Section>
      <Section title="Colors">
        <div className="appearance-colors">
          <ColorPicker label="Accent" value={value.accent} fallback={baseColors.accent} onChange={accent => update({ accent })} />
          <ColorPicker label="Background" value={value.background} fallback={baseColors.background} onChange={background => update({ background })} />
          <ColorPicker label="Foreground" value={value.foreground} fallback={baseColors.foreground} onChange={foreground => update({ foreground })} />
        </div>
      </Section>
      <Section title="Typography">
        <div className="appearance-type-row"><label htmlFor="ui-font">Interface font</label><Select id="ui-font" value={value.font} onChange={event => update({ font: event.target.value })}>{uiFonts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><label className="appearance-font-size"><span className="sr-only">Interface font size</span><Input type="number" min={12} max={20} step={1} value={value.uiFontSize} onChange={event => { const size = event.target.valueAsNumber; if (Number.isFinite(size)) update({ uiFontSize: Math.min(20, Math.max(12, size)) }); }} /><span>px</span></label></div>
        <div className="appearance-type-row"><label htmlFor="code-font">Code font</label><Select id="code-font" value={value.codeFont ?? 'mono'} onChange={event => update({ codeFont: event.target.value })}>{codeFonts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><label className="appearance-font-size"><span className="sr-only">Code font size</span><Input type="number" min={11} max={22} step={1} value={value.codeFontSize} onChange={event => { const size = event.target.valueAsNumber; if (Number.isFinite(size)) update({ codeFontSize: Math.min(22, Math.max(11, size)) }); }} /><span>px</span></label></div>
        <div className="appearance-type-preview"><p style={{ fontFamily: resolved.fontFamily, fontSize: value.uiFontSize }}>Interface text · Aa Bb Cc 0123456789</p><p style={{ fontFamily: resolved.codeFontFamily, fontSize: value.codeFontSize }}><span>const</span> canvas = 'ready';</p></div>
      </Section>
      <Section title="Motion"><div className="appearance-row"><label htmlFor="reduce-motion">Reduce motion</label><Switch id="reduce-motion" aria-label="Reduce motion" checked={value.reduceMotion} onCheckedChange={reduceMotion => update({ reduceMotion })} /></div></Section>
    </div>
  </div>;
}
