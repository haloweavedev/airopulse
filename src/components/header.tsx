'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg">AiroPulse</span>
        </Link>
        <p className="text-sm text-muted-foreground">Product Research Intelligence</p>
      </div>
    </header>
  );
}
