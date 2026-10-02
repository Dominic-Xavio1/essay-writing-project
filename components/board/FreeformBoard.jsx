'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Move } from 'lucide-react';

const CARD_WIDTH = 280;
const GAP = 28;
const STORAGE_KEY = 'asyv-board-positions';

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function DraggableNote({ id, initial, constraintsRef, onMove, onFront, z, children }) {
  const x = useMotionValue(initial.x);
  const y = useMotionValue(initial.y);
  const dragged = useRef(false);

  useEffect(() => {
    x.set(initial.x);
    y.set(initial.y);
  }, [initial.x, initial.y, x, y]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      dragElastic={0.08}
      onDragStart={() => {
        dragged.current = true;
        onFront(id);
      }}
      onDragEnd={() => {
        onMove(id, { x: x.get(), y: y.get() });
        setTimeout(() => {
          dragged.current = false;
        }, 0);
      }}
      onClickCapture={(e) => {
        if (dragged.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      whileDrag={{ scale: 1.05, rotate: 2, cursor: 'grabbing' }}
      style={{ x, y, width: CARD_WIDTH, zIndex: z }}
      className="absolute left-0 top-0 cursor-grab touch-none"
    >
      <div className="absolute -top-3 -right-3 z-20 grid h-7 w-7 place-items-center rounded-full bg-foreground text-background shadow-md opacity-0 transition-opacity [div:hover>&]:opacity-100">
        <Move size={14} />
      </div>
      {children}
    </motion.div>
  );
}

export function FreeformBoard({ items, renderItem, estimateHeight = (item) => (item.featured_image ? 500 : 330) }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [saved, setSaved] = useState({});
  const [order, setOrder] = useState([]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  const cols = Math.max(1, Math.floor((width + GAP) / (CARD_WIDTH + GAP)));

  const colHeights = Array(cols).fill(0);
  const positions = items.map((item, i) => {
    const col = colHeights.indexOf(Math.min(...colHeights));
    const jitter = ((i * 37) % 16) - 8;
    const auto = { x: Math.max(0, col * (CARD_WIDTH + GAP) + jitter), y: colHeights[col] + 16 + Math.abs(jitter) };
    colHeights[col] += estimateHeight(item) + GAP;
    return saved[item.id] || auto;
  });

  const height = Math.max(560, ...colHeights.map((h) => h + 40), ...positions.map((p) => p.y + 520));

  const handleMove = (id, pos) => {
    setSaved((prev) => {
      const next = { ...prev, [id]: pos };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const bringToFront = (id) => setOrder((prev) => [...prev.filter((x) => x !== id), id]);

  const resetLayout = () => {
    setSaved({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
        <span className="font-hand text-lg text-accent">Drag the notes around to make the wall yours</span>
        <button
          type="button"
          onClick={resetLayout}
          className="rounded-full border border-border bg-card px-3 py-1.5 hover:text-foreground hover:border-primary/40 transition-colors"
        >
          Tidy up
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative rounded-[2rem] border-2 border-dashed border-border bg-canvas-lines p-4"
        style={{ height }}
      >
        {width > 0 &&
          items.map((item, i) => (
            <DraggableNote
              key={item.id}
              id={item.id}
              initial={positions[i]}
              constraintsRef={containerRef}
              onMove={handleMove}
              onFront={bringToFront}
              z={order.indexOf(item.id) + 2}
            >
              {renderItem(item)}
            </DraggableNote>
          ))}
      </div>
    </div>
  );
}
