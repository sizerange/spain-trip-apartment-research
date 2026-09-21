import { Link, useLocation } from 'wouter';
import { useAuth, useClerk } from '@clerk/react';
import { Button } from '@/components/ui/button';
import { Building2, PieChart, LogOut, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={`${basePath}/logo.svg`} alt="Alicante Rental Pairs Logo" className="h-8 w-8" />
            <span className="hidden font-heading text-lg font-bold text-primary md:inline-block">
              Alicante Rental Pairs
            </span>
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            <Link 
              href="/" 
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground",
                location === '/' ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              )}
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline-block">Apartment pairs</span>
            </Link>
            <Link 
              href="/economy" 
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground",
                location === '/economy' ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              )}
            >
              <PieChart className="h-4 w-4" />
              <span>Economy numbers</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button variant="default" size="sm" asChild className="rounded-full shadow-sm">
              <Link href="/sign-in">
                <LogIn className="mr-2 h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline-block">Sign in</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}