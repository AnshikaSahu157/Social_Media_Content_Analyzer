import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { LineChart, Sparkles } from "lucide-react";

export default function SiteLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <div aria-hidden className="brand-gradient absolute inset-0 -z-10" />
      <Header currentPath={location.pathname} />
      <main className={cn("flex-1")}> 
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header({ currentPath }: { currentPath: string }) {
  const linkBase = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const linkActive = "text-primary bg-primary/10";
  const linkInactive = "text-foreground/70 hover:text-foreground hover:bg-foreground/5";

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
            <span className="text-lg font-extrabold tracking-tight">PulseLens</span>
          </Link>
          <nav className="ml-6 hidden md:flex items-center gap-1">
            <NavLink to="/" className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkInactive)}>
              Analyze
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkInactive)}>
              Reports
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PulseLens — Social Media Content Analyzer</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2"><LineChart className="size-4" /> Insights you can act on</span>
          <span className="hidden md:inline-flex items-center gap-2"><Sparkles className="size-4" /> AI-ready</span>
        </div>
      </div>
    </footer>
  );
}
