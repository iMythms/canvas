import { forwardRef } from 'react';
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDownToLineIcon,
  ArrowLeft02Icon,
  ArrowLeftRightIcon,
  ArrowRight02Icon,
  ArrowUpFromLineIcon,
  ArrowUpRight01Icon,
  Tick02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  CircleIcon,
  HelpCircleIcon,
  CodeIcon,
  Layout2ColumnIcon,
  Copy01Icon,
  DiamondIcon,
  EraserIcon,
  File02Icon,
  FolderOpenIcon,
  FrameIcon,
  GitCompareArrowsIcon,
  HandIcon,
  ImageAdd01Icon,
  LayoutTemplateIcon,
  LockIcon,
  LockKeyholeIcon,
  LockOpenIcon,
  Magnet01Icon,
  ArrowExpandIcon,
  ExpandIcon,
  Menu01Icon,
  ArrowShrinkIcon,
  MinusSignIcon,
  ComputerIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  Cursor01Icon,
  PaintBoardIcon,
  SidebarLeft01Icon,
  PencilEdit01Icon,
  PenTool01Icon,
  PinIcon,
  PlusSignIcon,
  ReplaceIcon,
  RotateLeft01Icon,
  Layout2RowIcon,
  Search01Icon,
  ShapesIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SquareIcon,
  Sun01Icon,
  Delete02Icon,
  TextFontIcon,
  TextWrapIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';

export type IconProps = Omit<HugeiconsIconProps, 'icon' | 'altIcon' | 'showAlt'>;

function createIcon(name: string, icon: IconSvgElement) {
  const Icon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <HugeiconsIcon
      ref={ref}
      aria-hidden={props['aria-label'] || props['aria-labelledby'] ? undefined : true}
      {...props}
      icon={icon}
    />
  ));
  Icon.displayName = name;
  return Icon;
}

// Keep component call sites stable while all glyphs come from Hugeicons.
export type IconComponent = ReturnType<typeof createIcon>;

export const ArrowDownToLine = createIcon('ArrowDownToLine', ArrowDownToLineIcon);
export const ArrowLeft = createIcon('ArrowLeft', ArrowLeft02Icon);
export const ArrowLeftRight = createIcon('ArrowLeftRight', ArrowLeftRightIcon);
export const ArrowRight = createIcon('ArrowRight', ArrowRight02Icon);
export const ArrowUpFromLine = createIcon('ArrowUpFromLine', ArrowUpFromLineIcon);
export const ArrowUpRight = createIcon('ArrowUpRight', ArrowUpRight01Icon);
export const Check = createIcon('Check', Tick02Icon);
export const ChevronDown = createIcon('ChevronDown', ArrowDown01Icon);
export const ChevronRight = createIcon('ChevronRight', ArrowRight01Icon);
export const Circle = createIcon('Circle', CircleIcon);
export const CircleHelp = createIcon('CircleHelp', HelpCircleIcon);
export const Code2 = createIcon('Code2', CodeIcon);
export const Columns2 = createIcon('Columns2', Layout2ColumnIcon);
export const Copy = createIcon('Copy', Copy01Icon);
export const Diamond = createIcon('Diamond', DiamondIcon);
export const Eraser = createIcon('Eraser', EraserIcon);
export const FileText = createIcon('FileText', File02Icon);
export const FolderOpen = createIcon('FolderOpen', FolderOpenIcon);
export const Frame = createIcon('Frame', FrameIcon);
export const GitCompareArrows = createIcon('GitCompareArrows', GitCompareArrowsIcon);
export const Hand = createIcon('Hand', HandIcon);
export const ImagePlus = createIcon('ImagePlus', ImageAdd01Icon);
export const LayoutTemplate = createIcon('LayoutTemplate', LayoutTemplateIcon);
export const Lock = createIcon('Lock', LockIcon);
export const LockKeyhole = createIcon('LockKeyhole', LockKeyholeIcon);
export const LockOpen = createIcon('LockOpen', LockOpenIcon);
export const Magnet = createIcon('Magnet', Magnet01Icon);
export const Maximize = createIcon('Maximize', ArrowExpandIcon);
export const Maximize2 = createIcon('Maximize2', ExpandIcon);
export const Menu = createIcon('Menu', Menu01Icon);
export const Minimize2 = createIcon('Minimize2', ArrowShrinkIcon);
export const Minus = createIcon('Minus', MinusSignIcon);
export const Monitor = createIcon('Monitor', ComputerIcon);
export const Moon = createIcon('Moon', Moon02Icon);
export const MoreHorizontal = createIcon('MoreHorizontal', MoreHorizontalIcon);
export const MousePointer2 = createIcon('MousePointer2', Cursor01Icon);
export const Palette = createIcon('Palette', PaintBoardIcon);
export const PanelLeftClose = createIcon('PanelLeftClose', SidebarLeft01Icon);
export const Pencil = createIcon('Pencil', PencilEdit01Icon);
export const PenTool = createIcon('PenTool', PenTool01Icon);
export const Pin = createIcon('Pin', PinIcon);
export const Plus = createIcon('Plus', PlusSignIcon);
export const Replace = createIcon('Replace', ReplaceIcon);
export const RotateCcw = createIcon('RotateCcw', RotateLeft01Icon);
export const Rows2 = createIcon('Rows2', Layout2RowIcon);
export const Search = createIcon('Search', Search01Icon);
export const Shapes = createIcon('Shapes', ShapesIcon);
export const ShieldCheck = createIcon('ShieldCheck', ShieldCheckIcon);
export const Sparkles = createIcon('Sparkles', SparklesIcon);
export const Square = createIcon('Square', SquareIcon);
export const Sun = createIcon('Sun', Sun01Icon);
export const Trash2 = createIcon('Trash2', Delete02Icon);
export const Type = createIcon('Type', TextFontIcon);
export const WrapText = createIcon('WrapText', TextWrapIcon);
export const X = createIcon('X', Cancel01Icon);
