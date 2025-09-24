"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal, Radix-free ScrollArea to avoid runtime issues with hooks
type RootProps = React.HTMLAttributes<HTMLDivElement>;

function ScrollArea({ className, children, ...props }: RootProps) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 overflow-auto"
      >
        {children}
      </div>
    </div>
  );
}

// No-op placeholder to match export surface; not used but avoids import breaks
function ScrollBar(_props: React.HTMLAttributes<HTMLDivElement>) {
  return null;
}

export { ScrollArea, ScrollBar };
