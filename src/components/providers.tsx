"use client";

import { SessionProvider } from "next-auth/react";

import { TooltipProvider } from "easySLR/components/ui/tooltip";
import { Toaster } from "easySLR/components/ui/sonner";
import { TRPCReactProvider } from "easySLR/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}
