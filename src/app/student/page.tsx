"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Briefcase, FileText, ArrowRight, Clock, CheckCircle } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logo_url: string | null;
  };
  location_type: string;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  job: {
    title: string;
    company: {
      name: string;
    };
  };
}

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/jobs/matched"),
        fetch("/api/applications"),
      ]);

      if (jobsRes.ok) {
        const jobs = (await jobsRes.json()) as Job[];
        setRecentJobs(jobs.slice(0, 5));
      }

      if (appsRes.ok) {
        const apps = (await appsRes.json()) as Application[];
        setApplications(apps.slice(0, 5));
        setStats({
          total: apps.length,
          pending: apps.filter((a) => a.status === "pending" || a.status === "scoring").length,
          shortlisted: apps.filter((a) => a.status === "shortlisted").length,
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || "Student"}!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your job search</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.shortlisted}</p>
                  <p className="text-sm text-muted-foreground">Shortlisted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Latest Opportunities</CardTitle>
                <CardDescription>AI-matched jobs based on your profile</CardDescription>
              </div>
              <Link href="/student/jobs">
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
              ) : recentJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No jobs available yet. Check back soon!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/student/jobs/${job.id}`}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{job.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.company?.name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {job.location_type}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Your Applications</CardTitle>
                <CardDescription>Track your application status</CardDescription>
              </div>
              <Link href="/student/applications">
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
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven't applied to any jobs yet
                  </p>
                  <Link href="/student/jobs">
                    <Button variant="hero" size="sm">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{app.job?.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {app.job?.company?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
