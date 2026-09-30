'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { EmojiPicker } from './EmojiPicker';

export function EmojiPickerPopover({
  trigger,
  onSelectEmoji,
  side = 'top',
  align = 'start',
  sideOffset = 8,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="z-[99999] outline-none animate-in fade-in-0 zoom-in-95 duration-150"
          onInteractOutside={() => setOpen(false)}
        >
          <EmojiPicker
            onSelectEmoji={(emoji) => {
              onSelectEmoji(emoji);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
