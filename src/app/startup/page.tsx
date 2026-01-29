"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Briefcase, Users, ArrowRight, Plus, TrendingUp, Eye, Clock } from "lucide-react";

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  application_count?: number;
}

interface Company {
  id: string;
  name: string;
}

const StartupDashboard = () => {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;

    try {
      const companyResponse = await fetch("/api/companies/me");
      if (!companyResponse.ok) throw new Error("Failed to load company");
      const companyData = (await companyResponse.json()) as Company;
      setCompany(companyData);

      const jobsResponse = await fetch(`/api/jobs?companyId=${companyData.id}`);
      if (jobsResponse.ok) {
        const jobsData = (await jobsResponse.json()) as Job[];
        setJobs(jobsData);

        const totalApplications = jobsData.reduce(
          (sum, job) => sum + (job.application_count || 0),
          0
        );

        setStats({
          totalJobs: jobsData.length,
          totalApplications,
          activeJobs: jobsData.filter((j) => j.status === "open").length,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
            <h1 className="font-display text-3xl font-bold mb-2">
              Welcome, {company?.name || "Company"}!
            </h1>
            <p className="text-muted-foreground">
              Manage your job postings and find your next great hire
            </p>
          </div>
          <Link href="/startup/jobs/new">
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalJobs}</p>
                  <p className="text-sm text-muted-foreground">Total Postings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeJobs}</p>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Your Job Postings</CardTitle>
              <CardDescription>Manage and track your job listings</CardDescription>
            </div>
            <Link href="/startup/jobs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
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
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/startup/jobs/${job.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.application_count || 0} applications
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                    <Link href={`/startup/jobs/${job.id}/applications`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Applicants
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StartupDashboard;
