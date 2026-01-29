"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { GraduationCap, Building2, Sparkles, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signUp, signIn } = useAuth();

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const initialRole = searchParams.get("role") as "student" | "startup" | null;

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [role, setRole] = useState<"student" | "startup">(initialRole || "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      router.push(profile.role === "student" ? "/student" : "/startup");
    }
  }, [user, profile, router]);

  const validateForm = (): boolean => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (role === "startup" && !companyName.trim()) {
      toast.error("Please enter your company name");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, role, fullName, companyName);
    setLoading(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-foreground/5" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <Link href="/" className="flex items-center gap-3 text-primary-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl">Launchpad</span>
          </Link>

          <div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-primary-foreground mb-6">
              {mode === "signup" ? "Start Your Journey Today" : "Welcome Back"}
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              {mode === "signup"
                ? "Join thousands of students and startups building the future together."
                : "Continue your journey connecting talent with opportunity."}
            </p>
          </div>

          <p className="text-primary-foreground/60 text-sm">
            © 2026 Edusphere. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <Tabs value={mode} onValueChange={(value) => setMode(value as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card className="border-0 shadow-lg">
                <CardHeader className="space-y-1">
                  <CardTitle className="font-display text-2xl">Sign in to your account</CardTitle>
                  <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-0 shadow-lg">
                <CardHeader className="space-y-1">
                  <CardTitle className="font-display text-2xl">Create an account</CardTitle>
                  <CardDescription>Choose your account type to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        role === "student"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <GraduationCap
                        className={`w-8 h-8 mx-auto mb-2 ${
                          role === "student" ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          role === "student" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        Student
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("startup")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        role === "startup"
                          ? "border-accent bg-accent/5 shadow-md"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <Building2
                        className={`w-8 h-8 mx-auto mb-2 ${
                          role === "startup" ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          role === "startup" ? "text-accent" : "text-foreground"
                        }`}
                      >
                        Startup
                      </span>
                    </button>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    {role === "startup" && (
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                          id="company-name"
                          type="text"
                          placeholder="Acme Inc."
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant={role === "student" ? "hero" : "heroAccent"}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading
                        ? "Creating account..."
                        : `Create ${role === "student" ? "Student" : "Startup"} Account`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
