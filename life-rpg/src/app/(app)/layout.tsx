import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row">
      {/* Desktop Sidebar (hidden on screens < 768px) */}
      <Sidebar />

      {/* Mobile Top Bar, Bottom Bar & Slide-out Realm Menu (visible only on screens < 768px) */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="main-content flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
