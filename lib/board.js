import { Globe2, FlaskConical, Palette, Rocket, Feather, Camera, PenLine } from 'lucide-react';

export function hashString(value = '') {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ───────────────────────────────────────────────────────────────────────────
   GENRES
   Every genre gets its own identity: a label, a glyph, an accent, a rule
   style and a paper pattern. They are told apart mostly by form — the
   accent colour is the quietest part of the difference.
   ─────────────────────────────────────────────────────────────────────────── */

export const CATEGORY_META = {
  All: {
    key: 'all',
    icon: Globe2,
    label: 'Everything',
    kicker: 'The whole shelf',
    blurb: 'Every piece of writing in the collection.',
    mark: '✳',
    accent: 'var(--forest)',
    tone: 'text-primary',
    rule: 'solid',
    pattern: 'rule',
    titleFont: 'display',
  },
  Technology: {
    key: 'science',
    icon: FlaskConical,
    label: 'Ideas & Science',
    kicker: 'Research & reasoning',
    blurb: 'Experiments, research notes and arguments about how things work.',
    mark: '§',
    accent: 'var(--orange)',
    tone: 'text-orange',
    rule: 'dotted',
    pattern: 'grid',
    titleFont: 'sans',
  },
  Design: {
    key: 'design',
    icon: Palette,
    label: 'The Design Room',
    kicker: 'Making & shaping',
    blurb: 'Drawing, building, and writing about the things we make.',
    mark: '◍',
    accent: 'var(--terracotta)',
    tone: 'text-terracotta',
    rule: 'double',
    pattern: 'swatch',
    titleFont: 'display',
  },
  Business: {
    key: 'founders',
    icon: Rocket,
    label: 'Young Founders',
    kicker: 'Plans & ventures',
    blurb: 'Ideas with a plan attached — enterprise, money, ambition.',
    mark: '❖',
    accent: 'var(--forest)',
    tone: 'text-primary',
    rule: 'bracket',
    pattern: 'dots',
    titleFont: 'sans',
  },
  Personal: {
    key: 'essay',
    icon: Feather,
    label: 'Life at ASYV',
    kicker: 'Essays & poems',
    blurb: 'Personal essays, letters and poems from the village.',
    mark: '❧',
    accent: 'var(--ink)',
    tone: 'text-ink',
    rule: 'solid',
    pattern: 'rule',
    titleFont: 'reading',
  },
  Photography: {
    key: 'lens',
    icon: Camera,
    label: 'Through the Lens',
    kicker: 'Seen & recorded',
    blurb: 'Pictures first, with the words that go around them.',
    mark: '◎',
    accent: 'var(--ink-soft)',
    tone: 'text-ink-soft',
    rule: 'dashed',
    pattern: 'frame',
    titleFont: 'display',
  },
};

export const DEFAULT_CATEGORY = {
  key: 'notes',
  icon: PenLine,
  label: 'Writing',
  kicker: 'From the village',
  blurb: 'Writing by ASYV students.',
  mark: '❦',
  accent: 'var(--forest)',
  tone: 'text-primary',
  rule: 'solid',
  pattern: 'rule',
  titleFont: 'display',
};

export function categoryMeta(cat) {
  return CATEGORY_META[cat] || { ...DEFAULT_CATEGORY, label: cat || DEFAULT_CATEGORY.label };
}

/* The border treatment that belongs to a genre. */
export function genreRuleClass(cat) {
  const style = categoryMeta(cat).rule;
  if (style === 'dotted') return 'border-dotted';
  if (style === 'dashed') return 'border-dashed';
  if (style === 'double') return 'border-double border-t-[3px]';
  return 'border-solid';
}

/* ───────────────────────────────────────────────────────────────────────────
   LAYOUT VARIETY
   Cards are deliberately not identical: a stable hash of the post id picks
   one of several editorial treatments, so a page of writing reads like a
   spread rather than a grid of boxes.
   ─────────────────────────────────────────────────────────────────────────── */

export const CARD_VARIANTS = ['plain', 'ruled', 'quoted', 'numbered'];

export function cardVariantFor(id) {
  return CARD_VARIANTS[hashString(`${id}-variant`) % CARD_VARIANTS.length];
}

/* Legacy helpers. Paper does not tilt in this design, so the tilt is zero
   and the "note style" is a single paper stock; both are kept because other
   components still import them. */
export const NOTE_STYLES = [
  { bg: 'bg-card', tape: 'bg-primary/30', chip: 'bg-secondary text-foreground' },
];

export function noteStyleFor() {
  return NOTE_STYLES[0];
}

export function noteTiltFor() {
  return 0;
}

export function formatShortDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatLongDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ───────────────────────────────────────────────────────────────────────────
   MOTION
   Short, soft, and in one direction. Framer Motion respects the OS
   reduced-motion setting through the <MotionConfig> set in the app template.
   ─────────────────────────────────────────────────────────────────────────── */

export const boardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

export const boardItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export const riseIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
