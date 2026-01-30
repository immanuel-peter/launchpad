"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, User, Star, Calendar, FileText, ExternalLink, Mail, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";

interface Application {
  id: string;
  status: string;
  score: number | null;
  score_breakdown?: {
    skillsMatch?: { score: number; reasoning: string };
    experienceFit?: { score: number; reasoning: string };
    educationMatch?: { score: number; reasoning: string };
    overallRecommendation?: string;
  };
  cover_letter: string | null;
  applied_at: string;
  student: {
    id: string;
    bio: string | null;
    university: string | null;
    major: string | null;
    graduation_year: number | null;
    skills: string[] | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    user: {
      full_name: string | null;
      email: string;
    };
  };
}

interface Job {
  id: string;
  title: string;
}

const JobApplications = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    applicationId: string | null;
    nextStatus: "accepted" | "rejected" | null;
  }>({ open: false, applicationId: null, nextStatus: null });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchJobAndApplications();
  }, [params?.id]);

  useEffect(() => {
    if (!applications.some((app) => app.status === "scoring")) {
      return;
    }

    const interval = setInterval(() => {
      fetchJobAndApplications();
    }, 2000);

    return () => clearInterval(interval);
  }, [applications, params?.id]);

  const fetchJobAndApplications = async () => {
    if (!params?.id) return;

    try {
      const response = await fetch(`/api/jobs/${params.id}/applications`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      setJob(data.job);
      setApplications(data.applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: "pending" | "reviewing" | "accepted" | "rejected"
  ) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setApplications((apps) =>
        apps.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );

      toast.success("Application status updated");
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      return false;
    }
  };

  const closeConfirmation = () => {
    setConfirmState({ open: false, applicationId: null, nextStatus: null });
  };

  const handleStatusSelect = (applicationId: string, newStatus: "pending" | "reviewing" | "accepted" | "rejected") => {
    if (newStatus === "accepted" || newStatus === "rejected") {
      setConfirmState({ open: true, applicationId, nextStatus: newStatus });
      return;
    }
    handleStatusChange(applicationId, newStatus);
  };

  const handleConfirmDecision = async () => {
    if (!confirmState.applicationId || !confirmState.nextStatus) {
      return;
    }
    setConfirming(true);
    const success = await handleStatusChange(confirmState.applicationId, confirmState.nextStatus);
    setConfirming(false);
    if (success) {
      closeConfirmation();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "scoring":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
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

  const toggleExpanded = (appId: string) => {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const isExpanded = (appId: string) => expandedApps.has(appId);

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">Applications</h1>
            <p className="text-muted-foreground mt-1">
              {job?.title} • {applications.length} applicant{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Applications will appear here once students start applying
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app, idx) => {
              const expanded = isExpanded(app.id);
              return (
                <Card key={app.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Rank & Score */}
                      <div className="flex lg:flex-col items-center gap-4 lg:gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          #{idx + 1}
                        </div>
                        {typeof app.score === "number" ? (
                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${getScoreColor(
                              app.score
                            )}`}
                          >
                            <Star className="w-4 h-4" />
                            {app.score}%
                          </div>
                        ) : (
                          <Badge className={getStatusColor(app.status)}>Scoring...</Badge>
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0 space-y-4">
                        {/* Header - Always Visible */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-display text-xl font-semibold">
                                  {app.student?.user?.full_name || "Student"}
                                </h3>
                                <p className="text-muted-foreground">
                                  {app.student?.university || "University not specified"}
                                  {app.student?.major && ` • ${app.student.major}`}
                                  {app.student?.graduation_year && ` • Class of ${app.student.graduation_year}`}
                                </p>
                                {/* Snapshot - Show when collapsed */}
                                {!expanded && app.student?.bio && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {app.student.bio.replace(/[#*`]/g, "").substring(0, 150)}
                                    {app.student.bio.length > 150 ? "..." : ""}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <Select
                                  value={
                                    (app.status === "scoring" ? "pending" : app.status) as
                                      | "pending"
                                      | "reviewing"
                                      | "accepted"
                                      | "rejected"
                                  }
                                  onValueChange={(value) =>
                                    handleStatusSelect(
                                      app.id,
                                      value as "pending" | "reviewing" | "accepted" | "rejected"
                                    )
                                  }
                                >
                                  <SelectTrigger className={`w-36 ${getStatusColor(app.status)}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="reviewing">Reviewing</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleExpanded(app.id)}
                                  className="shrink-0"
                                >
                                  {expanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expanded && (
                          <div className="space-y-4 pt-2 border-t">
                            {app.student?.bio && (
                              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                                <ReactMarkdown>{app.student.bio}</ReactMarkdown>
                              </div>
                            )}

                            {/* Skills */}
                            {app.student?.skills && app.student.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {app.student.skills.map((skill, i) => (
                                  <Badge key={i} variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Score Breakdown */}
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

                            {/* Cover Letter */}
                            {app.cover_letter && (
                              <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Cover Letter
                                </h4>
                                <p className="text-sm text-muted-foreground">{app.cover_letter}</p>
                              </div>
                            )}

                            {/* Links & Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                              {app.student?.id && (
                                <Link
                                  href={`/students/${app.student.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Launchpad
                                </Link>
                              )}
                              <a
                                href={`mailto:${app.student?.user?.email}`}
                                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                              >
                                <Mail className="w-4 h-4" />
                                Contact
                              </a>
                              {app.student?.linkedin_url && (
                                <a
                                  href={app.student.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  LinkedIn
                                </a>
                              )}
                              {app.student?.github_url && (
                                <a
                                  href={app.student.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  GitHub
                                </a>
                              )}
                              {app.student?.portfolio_url && (
                                <a
                                  href={app.student.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Portfolio
                                </a>
                              )}
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5 ml-auto">
                                <Calendar className="w-4 h-4" />
                                Applied {new Date(app.applied_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmationDialog
        open={confirmState.open}
        onOpenChange={(open) => (open ? setConfirmState((prev) => ({ ...prev, open })) : closeConfirmation())}
        title={confirmState.nextStatus === "accepted" ? "Accept candidate?" : "Reject candidate?"}
        description={
          confirmState.nextStatus === "accepted"
            ? "Are you sure you want to accept this candidate for the role?"
            : "Are you sure you want to reject this candidate for the role?"
        }
        confirmLabel={confirmState.nextStatus === "accepted" ? "Accept" : "Reject"}
        confirmVariant={confirmState.nextStatus === "accepted" ? "default" : "destructive"}
        onConfirm={handleConfirmDecision}
        confirmDisabled={confirming}
      />
    </DashboardLayout>
  );
};

export default JobApplications;
