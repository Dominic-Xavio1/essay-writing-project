'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function HeartPopEffect({ isLiked, onToggle, children, className = '' }) {
  const [bursts, setBursts] = useState([]);
  const [lastTap, setLastTap] = useState(0);

  const triggerBurst = (e) => {
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, id]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((bId) => bId !== id));
    }, 1000);
  };

  const handlePointerDown = (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap detected!
      e.preventDefault();
      triggerBurst(e);
      if (!isLiked) {
        onToggle(e);
      }
    }
    setLastTap(now);
  };

  const handleClick = (e) => {
    triggerBurst(e);
    if (onToggle) onToggle(e);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`relative inline-flex items-center select-none ${className}`}
    >
      {/* Heart Bursts (Absolute positioned to prevent any layout shifts) */}
      <AnimatePresence>
        {bursts.map((bId) => (
          <motion.div
            key={bId}
            initial={{ opacity: 1, scale: 0.4, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0.5, 1.4, 1.8],
              y: [-10, -45, -60],
              rotate: [-10, 10, -5],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none z-50 text-2xl"
          >
            ❤️
            {/* Particle Burst Ring */}
            <span className="absolute inset-0 animate-ping opacity-75 rounded-full bg-rose-500/20" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Trigger children element (Button or Card image/text) */}
      <div onClick={handleClick} className="w-full cursor-pointer">
        {children}
      </div>
    </div>
  );
}
