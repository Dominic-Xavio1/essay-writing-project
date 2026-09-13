'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ClapButton({ initialCount = 0, onClap, size = 'md' }) {
  const [claps, setClaps] = useState([]);
  const [active, setActive] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setActive(true);
    setTimeout(() => setActive(false), 300);

    const newId = Date.now() + Math.random();
    setClaps((prev) => [...prev, { id: newId }]);

    if (onClap) onClap();
  };

  const removeClap = (id) => {
    setClaps((prev) => prev.filter((c) => c.id !== id));
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs font-semibold',
    lg: 'px-5 py-2.5 text-sm font-bold',
  };

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {claps.map((clap) => (
          <motion.span
            key={clap.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            onAnimationComplete={() => removeClap(clap.id)}
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-500 font-extrabold text-xs pointer-events-none z-30 select-none flex items-center gap-0.5"
          >
            👏 +1
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className={`relative flex items-center gap-2 rounded-full border transition-all duration-200 select-none ${
          active
            ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
            : 'bg-secondary border-border text-foreground hover:bg-muted'
        } ${sizeClasses[size]}`}
      >
        <span className="text-base">👏</span>
        <span>{initialCount}</span>
      </motion.button>
    </div>
  );
}
