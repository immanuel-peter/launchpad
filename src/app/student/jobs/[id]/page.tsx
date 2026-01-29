"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Building2, MapPin, Clock, Calendar, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  skills_required: string[] | null;
  duration: string | null;
  compensation: string | null;
  location_type: string | null;
  location: string | null;
  deadline: string | null;
  created_at: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    industry: string | null;
    website: string | null;
  };
}

interface ApplicationSummary {
  id: string;
  job: { id: string };
}

const JobDetail = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJob();
    checkIfApplied();
  }, [id]);

  const fetchJob = async () => {
    if (!id) return;

    try {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) throw new Error("Failed to fetch job");
      const data = (await response.json()) as Job;
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!id) return;
    try {
      const response = await fetch("/api/applications");
      if (!response.ok) return;
      const applications = (await response.json()) as ApplicationSummary[];
      setHasApplied(applications.some((app) => app.job.id === id));
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: id, cover_letter: coverLetter || null }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to submit application");
      }

      toast.success("Application submitted successfully!");
      setHasApplied(true);
    } catch (error: any) {
      console.error("Error applying:", error);
      if (error.message?.includes("Already applied")) {
        toast.error("You have already applied to this job");
      } else {
        toast.error("Failed to submit application");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-display text-xl font-semibold mb-2">Job not found</h2>
          <p className="text-muted-foreground mb-4">
            This job may have been removed or doesn't exist.
          </p>
          <Button variant="hero" onClick={() => router.push("/student/jobs")}>
            Browse Jobs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        {/* Job Header */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {job.company?.logo_url ? (
                  <img
                    src={job.company.logo_url}
                    alt={job.company.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-xl text-muted-foreground mb-4">{job.company?.name}</p>

                <div className="flex flex-wrap gap-4">
                  {job.location_type && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="capitalize">{job.location_type}</span>
                      {job.location && <span>• {job.location}</span>}
                    </div>
                  )}
                  {job.duration && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{job.duration}</span>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {job.compensation && <Badge variant="secondary" className="mt-4">{job.compensation}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="font-display">About this opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{job.description}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display">Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Apply */}
          <div className="space-y-6">
            <Card className="border-0 shadow-md sticky top-8">
              <CardHeader>
                <CardTitle className="font-display">
                  {hasApplied ? "Application Submitted" : "Apply Now"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="font-medium mb-2">You've applied to this job!</p>
                    <p className="text-sm text-muted-foreground">
                      We are scoring your application. Check the Applications tab for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                      <Textarea
                        id="cover-letter"
                        placeholder="Tell the company why you're a great fit..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={6}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleApply}
                      disabled={applying}
                    >
                      {applying ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            {job.company?.description && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display">About {job.company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground mb-4">
                    <ReactMarkdown>{job.company.description}</ReactMarkdown>
                  </div>
                  {job.company.industry && <Badge variant="secondary">{job.company.industry}</Badge>}
                  {job.company.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-4 text-sm text-primary hover:underline"
                    >
                      Visit Website →
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobDetail;
