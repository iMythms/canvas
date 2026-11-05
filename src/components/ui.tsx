import {
  Children, forwardRef, isValidElement, useEffect, useId, useState,
  type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode,
} from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, RotateCcw } from './icons';
import '../ui.css';

function classes(...values: (string | undefined | false)[]) {
  return values.filter(Boolean).join(' ');
}

/** Common content frame for tools and settings. */
export function WorkspaceSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes('workspace-surface', className)} {...props} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'ghost' | 'outline' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'icon';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, type = 'button', ...props }, ref,
) {
  const resolvedVariant = variant ?? (className?.includes('primary-button') ? 'primary' : className?.includes('danger-button') ? 'danger' : className?.includes('outline-button') ? 'outline' : 'ghost');
  const resolvedSize = size ?? (className?.includes('icon-button') || className?.includes('tab-close') ? 'icon' : 'md');
  return <button ref={ref} type={type} className={classes('ui-button', `ui-button--${resolvedVariant}`, `ui-control--${resolvedSize}`, className)} {...props} />;
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref,
) {
  return <input ref={ref} className={classes('ui-input', className)} {...props} />;
});

export type SelectChangeEvent = { target: { value: string }; currentTarget: { value: string } };
type SelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'children' | 'defaultValue'> & {
  value: string;
  onChange?: (event: SelectChangeEvent) => void;
  children: ReactNode;
  size?: 'sm' | 'md';
  name?: string;
  required?: boolean;
};

/** Keeps option-based call sites while presenting a fully custom, portalled listbox. */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onChange, children, className, size = 'md', name, required, disabled, ...props }, ref,
) {
  const options = Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value: string; children: ReactNode; disabled?: boolean }>(child)) return [];
    return [{ value: String(child.props.value), label: child.props.children, disabled: child.props.disabled }];
  });
  return <SelectPrimitive.Root value={value} onValueChange={next => onChange?.({ target: { value: next }, currentTarget: { value: next } })} name={name} required={required} disabled={disabled}>
    <SelectPrimitive.Trigger ref={ref} className={classes('ui-select', `ui-control--${size}`, className)} {...props}>
      <SelectPrimitive.Value />
      <SelectPrimitive.Icon className="ui-select-icon"><ChevronDown size={13} /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={5} collisionPadding={8}>
        <SelectPrimitive.ScrollUpButton className="ui-select-scroll"><ChevronDown size={12} className="ui-chevron-up" /></SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="ui-select-viewport">
          {options.map(option => <SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} className="ui-select-option">
            <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator className="ui-select-check"><Check size={13} /></SelectPrimitive.ItemIndicator>
          </SelectPrimitive.Item>)}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="ui-select-scroll"><ChevronDown size={12} /></SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
});

const colorSwatches = ['#b57248', '#cb5863', '#b66db0', '#7965c1', '#4c80be', '#358c91', '#55705c', '#9a8b3e', '#faf9f6', '#292824'];

export function ColorPicker({ label, value, fallback, onChange }: {
  label: string;
  value: string | null;
  fallback: string;
  onChange: (value: string | null) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value ?? fallback);
  useEffect(() => setDraft(value ?? fallback), [value, fallback]);
  const invalid = !/^#[\da-f]{6}$/i.test(draft);
  return <div className="ui-color-picker">
    <label htmlFor={id} className="ui-field-label">{label}</label>
    <div className="ui-color-field">
      <span className="ui-color-preview" style={{ background: value ?? fallback }} aria-hidden="true" />
      <Input id={id} aria-label={`${label} hex color`} className="ui-color-input" value={draft} spellCheck={false} autoComplete="off" maxLength={7} aria-invalid={invalid} onChange={event => {
        setDraft(event.target.value);
        if (/^#[\da-f]{6}$/i.test(event.target.value)) onChange(event.target.value.toLowerCase());
      }} onBlur={() => { if (invalid) setDraft(value ?? fallback); }} />
      <Button size="icon" className="ui-color-reset" disabled={!value} aria-label={`Reset ${label.toLowerCase()} color`} title="Reset color" onClick={() => onChange(null)}><RotateCcw size={12} /></Button>
    </div>
    <div className="ui-color-swatches" role="group" aria-label={`${label} color swatches`}>
      {colorSwatches.map(color => <Button key={color} className="ui-color-swatch" aria-label={`${label} ${color}`} aria-pressed={(value ?? fallback).toLowerCase() === color} title={color} onClick={() => onChange(color)} style={{ backgroundColor: color }} />)}
    </div>
  </div>;
}

export function Switch({ checked, onCheckedChange, className, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return <Button role="switch" aria-checked={checked} className={classes('ui-switch', className)} {...props} onClick={() => onCheckedChange(!checked)}><span /></Button>;
}
