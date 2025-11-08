"use client";

import { SessionProvider } from "next-auth/react";
import CartProvider from "./CartProvider";
import LoginPopupProvider from "./LoginPopupProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <LoginPopupProvider>
          {children}
        </LoginPopupProvider>
      </CartProvider>
    </SessionProvider>
  );
}

