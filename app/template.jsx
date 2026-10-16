'use client';

import { MotionConfig, motion } from 'framer-motion';

/**
 * Every route fades up a little as it arrives, like a page being laid down.
 * `reducedMotion="user"` makes Framer Motion obey the reader's own operating
 * system setting for the entire app, so no animation needs to opt out twice.
 */
export default function Template({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
