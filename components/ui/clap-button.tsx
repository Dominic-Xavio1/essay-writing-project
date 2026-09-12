'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface ClapButtonProps {
  initialCount?: number;
  isLiked?: boolean;
  onClap?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ClapButton({
  initialCount = 0,
  isLiked = false,
  onClap,
  size = 'md',
  showLabel = true,
}: ClapButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(isLiked);
  const [particles, setParticles] = useState<{ id: number; text: string; x: number }[]>([]);

  const handleClap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const newCount = liked ? count : count + 1;
    setCount(newCount);
    setLiked(!liked);

    if (!liked) {
      const newParticle = {
        id: Date.now() + Math.random(),
        text: '+1',
        x: (Math.random() - 0.5) * 20,
      };
      setParticles((prev) => [...prev.slice(-4), newParticle]);
    }

    if (onClap) onClap();
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 22,
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Particle Popups */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{ opacity: 1, y: 0, scale: 0.8, x: particle.x }}
            animate={{ opacity: 0, y: -35, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onAnimationComplete={() => {
              setParticles((prev) => prev.filter((p) => p.id !== particle.id));
            }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none font-bold text-xs text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shadow-sm"
          >
            {particle.text} 🔥
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
        onClick={handleClap}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
          liked
            ? 'bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-900/50'
            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
        }`}
        title={liked ? 'Liked essay' : 'Clap / Like this essay'}
      >
        <motion.div
          animate={liked ? { scale: [1, 1.35, 1], rotate: [0, -12, 12, 0] } : {}}
          transition={{ duration: 0.35 }}
        >
          <Heart
            size={iconSizes[size]}
            className={`transition-colors ${liked ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </motion.div>
        {showLabel && (
          <span className="font-semibold text-xs tracking-tight">
            {count.toLocaleString()}
          </span>
        )}
      </motion.button>
    </div>
  );
}
