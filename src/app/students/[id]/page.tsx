"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { FileText } from "lucide-react";

interface PublicStudentProfile {
  id: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  bio: string | null;
  resume_url: string | null;
}

const PublicStudentProfilePage = () => {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/student-profiles/${params.id}`);
        if (!response.ok) {
          throw new Error("Profile not found");
        }
        const data = (await response.json()) as PublicStudentProfile;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              {error || "Profile not found"}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-3xl">
              {profile.full_name || "Student Profile"}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {[profile.university, profile.major, profile.graduation_year && `Class of ${profile.graduation_year}`]
                .filter(Boolean)
                .join(" • ")}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="bio" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bio">Bio</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="bio">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                {profile.bio ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                    <ReactMarkdown>{profile.bio}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bio provided yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 space-y-4">
                {profile.resume_url ? (
                  <>
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Open resume in a new tab
                    </a>
                    <iframe
                      title="Resume"
                      src={profile.resume_url}
                      className="w-full h-[600px] rounded-lg border border-border"
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No resume uploaded yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PublicStudentProfilePage;
