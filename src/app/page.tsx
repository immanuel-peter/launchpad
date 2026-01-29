"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Building2,
  ArrowRight,
  Sparkles,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const HomePage = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Launchpad</span>
          </Link>

          <div className="flex items-center gap-4">
            {user && profile ? (
              <Link href={profile.role === "student" ? "/student" : "/startup"}>
                <Button variant="hero" size="sm">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-subtle" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            The Future of Student-Startup Collaboration
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            Where <span className="text-gradient-hero">Talent</span> Meets
            <br />
            <span className="text-gradient-hero">Opportunity</span>
          </h1>

          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Connect ambitious students with innovative startups through micro-internships.
            AI-powered matching ensures the perfect fit every time.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link href="/auth?mode=signup&role=student">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <GraduationCap className="w-5 h-5" />
                I'm a Student
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth?mode=signup&role=startup">
              <Button variant="heroAccent" size="xl" className="w-full sm:w-auto">
                <Building2 className="w-5 h-5" />
                I'm a Startup
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A seamless experience for both students and startups
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Create Your Profile"
              description="Students showcase skills and experience. Startups describe their mission and opportunities."
              gradient="gradient-primary"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Smart Matching"
              description="Our AI analyzes applications and provides compatibility scores for perfect matches."
              gradient="gradient-accent"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Launch Together"
              description="Start collaborating on exciting micro-internships and build real-world experience."
              gradient="gradient-hero"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of students and startups already transforming the way they connect.
          </p>
          <Link href="/auth?mode=signup">
            <Button variant="hero" size="xl">
              Create Your Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-hero flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Launchpad</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Edusphere. Connecting talent with opportunity.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const FeatureCard = ({ icon, title, description, gradient }: FeatureCardProps) => (
  <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div
      className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center mb-6 text-primary-foreground group-hover:scale-110 transition-transform duration-300`}
    >
      {icon}
    </div>
    <h3 className="font-display text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default HomePage;
