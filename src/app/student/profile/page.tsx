"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { User, X, Plus, Save } from "lucide-react";

interface StudentProfile {
  id: string;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  bio: string | null;
  skills: string[] | null;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
}

const StudentProfile = () => {
  const { profile } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [profile?.id]);

  const fetchProfile = async () => {
    if (!profile?.id) return;

    try {
      const response = await fetch("/api/student-profiles/me");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = (await response.json()) as StudentProfile;

      setStudentProfile(data);
      setFullName(profile.full_name || "");
      setUniversity(data.university || "");
      setMajor(data.major || "");
      setGraduationYear(data.graduation_year?.toString() || "");
      setBio(data.bio || "");
      setSkills(data.skills || []);
      setLinkedinUrl(data.linkedin_url || "");
      setGithubUrl(data.github_url || "");
      setPortfolioUrl(data.portfolio_url || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSave = async () => {
    if (!profile?.id) {
      toast.error("Profile not loaded");
      return;
    }

    setSaving(true);
    try {
      const profileResponse = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json().catch(() => ({ message: "Failed to update profile" }));
        throw new Error(error.message || "Failed to update profile");
      }

      const studentResponse = await fetch("/api/student-profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university,
          major,
          graduation_year: graduationYear ? parseInt(graduationYear) : null,
          bio,
          skills,
          linkedin_url: linkedinUrl || null,
          github_url: githubUrl || null,
          portfolio_url: portfolioUrl || null,
        }),
      });

      if (!studentResponse.ok) {
        const error = await studentResponse.json().catch(() => ({ message: "Failed to update student profile" }));
        throw new Error(error.message || "Failed to update student profile");
      }

      toast.success("Profile updated successfully!");
      // Refetch to get updated data
      await fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">
              Complete your profile to stand out to startups
            </p>
          </div>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Profile Picture */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{fullName || "Your Name"}</h3>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Basic Information</CardTitle>
            <CardDescription>Tell startups about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Stanford University"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major / Field of Study</Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Expected Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="2025"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself, your interests, and what you're looking for..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Skills</CardTitle>
            <CardDescription>Add your technical and soft skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g., Python, React, Leadership)"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              />
              <Button variant="outline" onClick={handleAddSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Links */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Links</CardTitle>
            <CardDescription>Add your professional links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input
                id="portfolio"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
