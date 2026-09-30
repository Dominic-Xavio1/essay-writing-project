'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CreativeLikeAnimation({
  isLiked,
  onToggle,
  children,
  className = '',
  enableDoubleTap = true,
  showPlusOne = true,
  particleType = 'hearts', // 'hearts' | 'sparkles' | 'fire'
}) {
  const [bursts, setBursts] = useState([]);
  const [lastTap, setLastTap] = useState(0);
  const containerRef = useRef(null);

  const triggerBurst = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e && rect ? e.clientX - rect.left : rect ? rect.width / 2 : 20;
    const y = e && rect ? e.clientY - rect.top : rect ? rect.height / 2 : 20;

    // Generate 12 radial spark particles with unique angles and distances
    const particles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 + Math.random() * 15) * (Math.PI / 180);
      const distance = 40 + Math.random() * 50;
      return {
        id: Math.random(),
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 20, // bias upwards
        scale: 0.6 + Math.random() * 0.8,
        rotate: (Math.random() - 0.5) * 60,
        emoji:
          particleType === 'fire'
            ? ['🔥', '✨', '⚡', '💥'][Math.floor(Math.random() * 4)]
            : ['💖', '❤️', '✨', '🌟', '💫', '🔥'][Math.floor(Math.random() * 6)],
      };
    });

    const burstId = Date.now() + Math.random();
    const newBurst = { id: burstId, x, y, particles };

    setBursts((prev) => [...prev, newBurst]);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 1000);
  };

  const handlePointerDown = (e) => {
    if (!enableDoubleTap) return;
    const now = Date.now();
    if (now - lastTap < 320) {
      // Double tap detected! (Instagram / TikTok style)
      e.preventDefault();
      triggerBurst(e);
      if (!isLiked && onToggle) {
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
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`relative inline-flex items-center select-none ${className}`}
    >
      {/* Particle & Heart Bursts */}
      <AnimatePresence>
        {bursts.map((b) => (
          <div
            key={b.id}
            className="absolute pointer-events-none z-50 overflow-visible"
            style={{ left: b.x, top: b.y }}
          >
            {/* Center Glowing 3D Heart Pop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.2, y: 0, rotate: -15 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.2, 1.4, 1.1, 0.8],
                y: [-5, -35, -55],
                rotate: [-15, 10, -5, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="absolute -left-5 -top-5 w-10 h-10 flex items-center justify-center text-3xl filter drop-shadow-[0_4px_12px_rgba(244,63,94,0.6)]"
            >
              ❤️
            </motion.div>

            {/* Floating +1 Pill */}
            {showPlusOne && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [-10, -45], scale: [0.8, 1, 0.9] }}
                transition={{ duration: 0.8, delay: 0.05 }}
                className="absolute left-3 -top-8 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-[11px] shadow-lg border border-white/20 whitespace-nowrap"
              >
                +1
              </motion.div>
            )}

            {/* Shockwave Glow Ring */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -left-6 -top-6 w-12 h-12 rounded-full border-2 border-rose-500/80 bg-rose-500/20"
            />

            {/* Radial Particles */}
            {b.particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.2, rotate: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: p.dx,
                  y: p.dy,
                  scale: [0.2, p.scale, p.scale * 0.5],
                  rotate: p.rotate,
                }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute text-base select-none pointer-events-none"
              >
                {p.emoji}
              </motion.span>
            ))}
          </div>
        ))}
      </AnimatePresence>

      {/* Trigger Children Element */}
      <div onClick={handleClick} className="w-full cursor-pointer">
        {children}
      </div>
    </div>
  );
}
