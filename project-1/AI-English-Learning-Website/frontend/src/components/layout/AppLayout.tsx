import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

/** App shell for all protected pages: sidebar + top navbar + mobile bottom nav. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="animate-fade-in mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-6 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default AppLayout;
