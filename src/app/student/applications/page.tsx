"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2, Calendar, Star } from "lucide-react";

interface Application {
  id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  score: number | null;
  score_breakdown?: {
    skillsMatch?: { score: number; reasoning: string };
    experienceFit?: { score: number; reasoning: string };
    educationMatch?: { score: number; reasoning: string };
    overallRecommendation?: string;
  };
  job: {
    id: string;
    title: string;
    company: {
      name: string;
      logo_url: string | null;
    };
  };
}

const StudentApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (!applications.some((app) => app.status === "scoring")) {
      return;
    }

    const interval = setInterval(() => {
      fetchApplications();
    }, 2000);

    return () => clearInterval(interval);
  }, [applications]);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications");
      if (!response.ok) return;
      const data = (await response.json()) as Application[];
      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "scoring":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-green-100 text-green-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track the status of all your job applications</p>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">
                Start applying to jobs to see them here
              </p>
              <Link href="/student/jobs">
                <span className="text-primary hover:underline">Browse available jobs →</span>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {app.job?.company?.logo_url ? (
                        <img
                          src={app.job.company.logo_url}
                          alt={app.job.company.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/student/jobs/${app.job?.id}`}
                        className="font-display text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {app.job?.title}
                      </Link>
                      <p className="text-muted-foreground">{app.job?.company?.name}</p>
                    </div>

                    {/* Status & Date */}
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <Badge className={getStatusColor(app.status)}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Applied {formatDate(app.applied_at)}</span>
                      </div>
                    </div>
                  </div>

                  {typeof app.score === "number" && (
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${getScoreColor(app.score)}`}>
                        <Star className="w-4 h-4" />
                        {app.score}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        AI match score with reasoning below
                      </span>
                    </div>
                  )}

                  {app.score_breakdown && (
                    <div className="bg-muted/40 rounded-lg p-4 space-y-3 text-sm">
                      {app.score_breakdown.skillsMatch && (
                        <div>
                          <p className="font-medium">Skills Match</p>
                          <p className="text-muted-foreground">
                            {app.score_breakdown.skillsMatch.reasoning}
                          </p>
                        </div>
                      )}
                      {app.score_breakdown.experienceFit && (
                        <div>
                          <p className="font-medium">Experience Fit</p>
                          <p className="text-muted-foreground">
                            {app.score_breakdown.experienceFit.reasoning}
                          </p>
                        </div>
                      )}
                      {app.score_breakdown.educationMatch && (
                        <div>
                          <p className="font-medium">Education Match</p>
                          <p className="text-muted-foreground">
                            {app.score_breakdown.educationMatch.reasoning}
                          </p>
                        </div>
                      )}
                      {app.score_breakdown.overallRecommendation && (
                        <div>
                          <p className="font-medium">Overall Recommendation</p>
                          <p className="text-muted-foreground">
                            {app.score_breakdown.overallRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {app.cover_letter && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Your cover letter:</span>{" "}
                        {app.cover_letter.length > 200
                          ? `${app.cover_letter.substring(0, 200)}...`
                          : app.cover_letter}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentApplications;
