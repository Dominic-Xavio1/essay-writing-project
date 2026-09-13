'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Check } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export function AuthorHoverCard({ author, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(author?.isFollowing ?? false);
  const [followers, setFollowers] = useState(author?.followers ?? 0);

  if (!author) return children;

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowers((prev) => Math.max(0, prev + (nextFollowing ? 1 : -1)));

    try {
      const res = await api.followUser(author.id);
      setIsFollowing(res.following);
      toast.success(res.following ? `Following ${author.name}` : `Unfollowed ${author.name}`);
    } catch {
      setIsFollowing(!nextFollowing);
      setFollowers((prev) => Math.max(0, prev + (nextFollowing ? -1 : 1)));
      toast.error('Sign in to follow authors');
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 bottom-full mb-2 w-72 bg-card border border-border/90 shadow-2xl rounded-2xl p-4 z-50 pointer-events-auto"
          >
            <div className="flex items-start gap-3.5 mb-3">
              <img
                src={author.avatar || '/placeholder-user.jpg'}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
              />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/author/${author.id}`}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                >
                  {author.name}
                </Link>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users size={12} /> <span>{followers} followers</span>
                </p>
              </div>
            </div>

            {author.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                {author.bio}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <Link
                href={`/author/${author.id}`}
                className="flex-1 text-center py-1.5 bg-secondary hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors"
              >
                View Profile
              </Link>

              <button
                onClick={handleFollow}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  isFollowing
                    ? 'bg-secondary text-foreground border border-border hover:bg-muted'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check size={13} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={13} /> Follow
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
