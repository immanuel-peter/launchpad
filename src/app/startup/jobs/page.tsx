"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Briefcase, Plus, Users, Clock, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  status: string;
  location_type: string | null;
  created_at: string;
  application_count?: number;
}

interface Company {
  id: string;
}

const StartupJobs = () => {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [profile?.id]);

  const fetchJobs = async () => {
    if (!profile?.id) return;

    try {
      const companyResponse = await fetch("/api/companies/me");
      if (!companyResponse.ok) throw new Error("Failed to load company");
      const company = (await companyResponse.json()) as Company;
      setCompanyId(company.id);

      const jobsResponse = await fetch(`/api/jobs?companyId=${company.id}`);
      const jobsData = (await jobsResponse.json()) as Job[];
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete job");
      setJobs(jobs.filter((j) => j.id !== jobId));
      toast.success("Job deleted successfully");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  const handleUpdateStatus = async (
    jobId: string,
    status: "draft" | "open" | "closed" | "filled"
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");

      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status } : j)));
      toast.success("Status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "filled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">My Job Postings</h1>
            <p className="text-muted-foreground">Manage all your job listings in one place</p>
          </div>
          <Link href="/startup/jobs/new">
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No jobs posted yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first job posting to start receiving applications
              </p>
              <Link href="/startup/jobs/new">
                <Button variant="hero">
                  <Plus className="w-4 h-4" />
                  Post Your First Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {job.application_count || 0} applications
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            {job.location_type && (
                              <Badge variant="outline" className="capitalize">
                                {job.location_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>

                      <Link href={`/startup/jobs/${job.id}/applications`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Applicants
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/startup/jobs/${job.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                          {job.status === "open" ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "closed")}>
                              Close Job
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "open")}>
                              Reopen Job
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StartupJobs;
