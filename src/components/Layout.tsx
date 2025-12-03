import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Download, Activity, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link
        to="/"
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg premium-transition",
          isActive("/")
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary text-foreground opacity-95 hover:opacity-100"
        )}
      >
        <Home className="h-4 w-4" />
        <span className="font-medium">Home</span>
      </Link>
      <Link
        to="/download"
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg premium-transition",
          isActive("/download")
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary text-foreground opacity-95 hover:opacity-100"
        )}
      >
        <Download className="h-4 w-4" />
        <span className="font-medium">Download</span>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">Air Quality Monitor</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Multi-Device System</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <NavLinks />
            </nav>

            {/* Mobile Navigation */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="premium-transition premium-btn-active">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-card">
                <nav className="flex flex-col gap-2 mt-8">
                  <NavLinks onClick={() => setOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
