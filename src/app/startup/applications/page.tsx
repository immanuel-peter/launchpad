"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Calendar, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Application {
  id: string;
  status: string;
  score: number | null;
  applied_at: string;
  job: {
    id: string;
    title: string;
  };
  student: {
    id: string;
    university: string | null;
    user: {
      full_name: string | null;
      email: string;
    };
  };
}

const AllApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  const handleStatusChange = async (
    applicationId: string,
    newStatus: "pending" | "reviewing" | "shortlisted" | "accepted" | "rejected"
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

      toast.success("Status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
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
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const filteredApplications =
    filterStatus === "all" ? applications : applications.filter((app) => app.status === filterStatus);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">All Applications</h1>
            <p className="text-muted-foreground">Review and manage all candidate applications</p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["all", "pending", "reviewing", "shortlisted", "accepted"].map((status) => {
            const count =
              status === "all"
                ? applications.length
                : applications.filter((a) => a.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`p-4 rounded-xl transition-all ${
                  filterStatus === status
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card border border-border hover:border-primary/50"
                }`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm capitalize opacity-80">{status}</p>
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No applications found</h3>
              <p className="text-muted-foreground">
                {filterStatus !== "all"
                  ? "Try changing the filter to see more applications"
                  : "Applications will appear here once students start applying"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((app) => (
              <Card key={app.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold truncate">
                          {app.student?.user?.full_name || "Student"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {app.student?.university || "University not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Job */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate max-w-48">{app.job?.title}</span>
                    </div>

                    {/* Score */}
                    {typeof app.score === "number" && (
                      <div className={`flex items-center gap-1 font-semibold ${getScoreColor(app.score)}`}>
                        <Star className="w-4 h-4" />
                        {app.score}%
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(app.applied_at).toLocaleDateString()}
                    </div>

                    {/* Status */}
                    <Select
                      value={
                        (app.status === "scoring" ? "pending" : app.status) as
                          | "pending"
                          | "reviewing"
                          | "shortlisted"
                          | "accepted"
                          | "rejected"
                      }
                      onValueChange={(value) =>
                        handleStatusChange(
                          app.id,
                          value as "pending" | "reviewing" | "shortlisted" | "accepted" | "rejected"
                        )
                      }
                    >
                      <SelectTrigger className={`w-32 ${getStatusColor(app.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
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

export default AllApplications;
