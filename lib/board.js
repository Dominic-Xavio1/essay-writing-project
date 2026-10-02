import { Globe2, Lightbulb, Palette, Rocket, HeartHandshake, Camera, PenLine } from 'lucide-react';

export const NOTE_STYLES = [
  { bg: 'bg-note-mint', tape: 'bg-primary/60', chip: 'bg-primary text-primary-foreground' },
  { bg: 'bg-note-peach', tape: 'bg-accent/60', chip: 'bg-accent text-accent-foreground' },
  { bg: 'bg-note-butter', tape: 'bg-amber-400/70', chip: 'bg-accent text-accent-foreground' },
  { bg: 'bg-note-sky', tape: 'bg-sky-400/60', chip: 'bg-primary text-primary-foreground' },
  { bg: 'bg-note-lilac', tape: 'bg-violet-400/60', chip: 'bg-accent text-accent-foreground' },
  { bg: 'bg-note-white', tape: 'bg-primary/50', chip: 'bg-primary text-primary-foreground' },
];

export function hashString(value = '') {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function noteStyleFor(id) {
  return NOTE_STYLES[hashString(String(id)) % NOTE_STYLES.length];
}

export function noteTiltFor(id) {
  const tilts = [-1.6, -0.8, 0, 0.8, 1.4];
  return tilts[hashString(`${id}-tilt`) % tilts.length];
}

export const CATEGORY_META = {
  All: { icon: Globe2, label: 'Everything', tone: 'text-primary' },
  Technology: { icon: Lightbulb, label: 'Tech & Ideas', tone: 'text-amber-500' },
  Design: { icon: Palette, label: 'Design Lab', tone: 'text-violet-500' },
  Business: { icon: Rocket, label: 'Young Founders', tone: 'text-accent' },
  Personal: { icon: HeartHandshake, label: 'Life at ASYV', tone: 'text-rose-500' },
  Photography: { icon: Camera, label: 'Through the Lens', tone: 'text-sky-500' },
};

export const DEFAULT_CATEGORY = { icon: PenLine, label: 'Notes', tone: 'text-primary' };

export function categoryMeta(cat) {
  return CATEGORY_META[cat] || { ...DEFAULT_CATEGORY, label: cat || DEFAULT_CATEGORY.label };
}

export function formatShortDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const boardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const boardItem = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
