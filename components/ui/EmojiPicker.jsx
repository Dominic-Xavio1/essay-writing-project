'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X, Smile, Heart, BookOpen, Flame, ThumbsUp, Zap } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Flame,
    emojis: ['🔥', '❤️', '👍', '💯', '👏', '🙌', '😍', '🎉', '🚀', '✨', '⭐', '💡', '🤯', '🧠'],
  },
  {
    id: 'reactions',
    name: 'Reactions',
    icon: Smile,
    emojis: ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💯', '👏', '🙌', '🤔', '👀', '🥳', '🤯'],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: Heart,
    emojis: ['❤️', '💖', '💝', '💗', '💓', '💞', '💕', '💙', '💚', '💛', '💜', '🖤', '🤍', '🤎', '🧡', '❤️‍🔥'],
  },
  {
    id: 'writing',
    name: 'Writing & Books',
    icon: BookOpen,
    emojis: ['✍️', '📚', '📖', '📝', '🎓', '🧠', '💡', '🖋️', '📜', '🎨', '🔬', '✨', '☕', '🕯️', '📍'],
  },
  {
    id: 'mindset',
    name: 'Growth & Hype',
    icon: Zap,
    emojis: ['🚀', '🎯', '🌱', '🏆', '⚡', '💪', '🌟', '🔮', '💎', '🧭', '⏳', '📈', '🥇', '👑', '🌈'],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👏', '🤝', '✌️', '🤞', '🤟', '👋', '🫡', '🙏', '💪', '👊', '👉', '👌'],
  },
];

export function EmojiPicker({ onSelectEmoji, onClose, className = '' }) {
  const [activeTab, setActiveTab] = useState('popular');
  const [search, setSearch] = useState('');

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji) => {
        // match emoji or standard search keywords
        return emoji.includes(search.trim());
      })
    : currentCategory.emojis;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`w-72 sm:w-80 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3 z-50 overflow-hidden ${className}`}
    >
      {/* Header & Search Bar */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/60">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-8 pr-3 py-1.5 bg-secondary/80 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!search.trim() && (
        <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                title={cat.name}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1 custom-scrollbar">
        {filteredEmojis.map((emoji, index) => (
          <motion.button
            key={`${emoji}-${index}`}
            whileHover={{ scale: 1.3, rotate: index % 2 === 0 ? 8 : -8 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              onSelectEmoji(emoji);
              if (onClose) onClose();
            }}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-secondary/90 transition-all select-none"
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
