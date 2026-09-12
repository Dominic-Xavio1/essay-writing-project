'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Heart, BookOpen, UserPlus, Check } from 'lucide-react';

interface AuthorHoverCardProps {
  author: {
    id: string;
    name: string;
    avatar: string;
    bio?: string;
    claps?: number;
    essaysCount?: number;
  };
  children: React.ReactNode;
}

export function AuthorHoverCard({ author, children }: AuthorHoverCardProps) {
  const [following, setFollowing] = useState(false);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFollowing(!following);
  };

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer inline-block">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 p-5 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl">
        <div className="flex justify-between items-start gap-4">
          <Link href={`/author/${author.id}`} className="flex items-center gap-3 group">
            <img
              src={author.avatar || '/placeholder-user.jpg'}
              alt={author.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all"
            />
            <div>
              <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                {author.name}
              </h4>
              <p className="text-xs text-muted-foreground">@author_{author.id.slice(0, 5)}</p>
            </div>
          </Link>
          <button
            onClick={handleFollow}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              following
                ? 'bg-secondary text-secondary-foreground border border-border'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            }`}
          >
            {following ? (
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

        <p className="text-xs text-muted-foreground leading-relaxed mt-3 line-clamp-2">
          {author.bio || 'Thoughtful writer & storyteller publishing essays on technology, society, and philosophy.'}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary" />
            <span className="font-semibold text-foreground">{author.essaysCount || 12}</span> Essays
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={14} className="text-rose-500" />
            <span className="font-semibold text-foreground">{(author.claps || 1420).toLocaleString()}</span> Claps
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
