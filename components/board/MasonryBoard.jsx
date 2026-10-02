'use client';

import { Children } from 'react';
import { motion } from 'framer-motion';
import { boardContainer } from '@/lib/board';
import { cn } from '@/lib/utils';

export function MasonryBoard({ children, className = '', columns = 'sm:columns-2 lg:columns-3 xl:columns-4' }) {
  return (
    <motion.div
      variants={boardContainer}
      initial="hidden"
      animate="show"
      className={cn('columns-1 gap-5', columns, className)}
    >
      {Children.map(children, (child) =>
        child ? <div className="mb-4 break-inside-avoid pt-4">{child}</div> : null
      )}
    </motion.div>
  );
}
