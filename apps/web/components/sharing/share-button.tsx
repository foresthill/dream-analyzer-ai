'use client';

import { useState } from 'react';
import { ShareDialog } from './share-dialog';

interface ShareButtonProps {
  dreamId?: string;
  dreamerId?: string;
  targetLabel: string;
  className?: string;
}

export function ShareButton({ dreamId, dreamerId, targetLabel, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary transition-colors'}
      >
        共有
      </button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        dreamId={dreamId}
        dreamerId={dreamerId}
        targetLabel={targetLabel}
      />
    </>
  );
}
