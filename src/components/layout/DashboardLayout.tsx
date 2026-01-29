"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Sparkles,
  LayoutDashboard,
  Briefcase,
  User,
  LogOut,
  FileText,
  Building2,
  Users,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isStartup = profile?.role === "startup";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const studentLinks = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/jobs", label: "Browse Jobs", icon: Briefcase },
    { href: "/student/applications", label: "My Applications", icon: FileText },
    { href: "/student/profile", label: "Profile", icon: User },
  ];

  const startupLinks = [
    { href: "/startup", label: "Dashboard", icon: LayoutDashboard },
    { href: "/startup/jobs", label: "My Postings", icon: Briefcase },
    { href: "/startup/applications", label: "Applications", icon: Users },
    { href: "/startup/company", label: "Company Profile", icon: Building2 },
  ];

  const links = isStartup ? startupLinks : studentLinks;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Launchpad</span>
          </Link>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          {isStartup && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link href="/startup/jobs/new">
                <Button variant="hero" className="w-full">
                  <Plus className="w-4 h-4" />
                  Post New Job
                </Button>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
