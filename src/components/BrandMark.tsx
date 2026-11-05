import type { SVGProps } from 'react';

/** The mark inherits its note surface and neutral line from the active theme. */
export default function BrandMark({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
    <rect x="2" y="2" width="60" height="60" rx="17" fill="var(--canvas-surface, #ecebe9)"/>
    <circle cx="16" cy="17" r="4.5" fill="#ff9f1c"/>
    <path d="M27 17h20" stroke="var(--canvas-muted, #bdbdbd)" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round"/>
    <path d="m23 27-7 6 7 6m18-12 7 6-7 6m-6-13-6 14" stroke="#559bf4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="48" r="4.5" fill="#5acb31"/>
    <path d="M27 48h20" stroke="var(--canvas-muted, #bdbdbd)" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round"/>
  </svg>;
}
