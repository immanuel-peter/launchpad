"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { Search, Briefcase, MapPin, Clock, Building2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  skills_required: string[] | null;
  duration: string | null;
  compensation: string | null;
  location_type: string | null;
  location: string | null;
  created_at: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
  };
}

interface Application {
  job: { id: string };
}

const StudentJobs = () => {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, [profile?.id]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = (await response.json()) as Job[];
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!profile?.id) return;

    try {
      const response = await fetch("/api/applications");
      if (!response.ok) return;
      const applications = (await response.json()) as Application[];
      setAppliedJobIds(applications.map((app) => app.job.id));
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills_required?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Browse Jobs</h1>
            <p className="text-muted-foreground">
              Find your perfect micro-internship opportunity
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Job Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
        </p>

        {/* Jobs List */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Check back soon for new opportunities!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {job.company?.logo_url ? (
                        <img
                          src={job.company.logo_url}
                          alt={job.company.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-display text-xl font-semibold mb-1">{job.title}</h3>
                          <p className="text-muted-foreground">{job.company?.name}</p>
                        </div>
                        {appliedJobIds.includes(job.id) ? (
                          <Badge className="bg-green-100 text-green-800 self-start">Applied</Badge>
                        ) : (
                          <Link href={`/student/jobs/${job.id}`}>
                            <Button variant="hero" size="sm">
                              View & Apply
                            </Button>
                          </Link>
                        )}
                      </div>

                      <p className="text-muted-foreground line-clamp-2 mb-4">{job.description}</p>

                      <div className="flex flex-wrap gap-3 mb-4">
                        {job.location_type && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="capitalize">{job.location_type}</span>
                            {job.location && <span>• {job.location}</span>}
                          </div>
                        )}
                        {job.duration && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{job.duration}</span>
                          </div>
                        )}
                        {job.compensation && <Badge variant="secondary">{job.compensation}</Badge>}
                      </div>

                      {job.skills_required && job.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.skills_required.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="font-normal">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills_required.length > 5 && (
                            <Badge variant="outline" className="font-normal">
                              +{job.skills_required.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Posted Date */}
                    <p className="text-sm text-muted-foreground shrink-0">{formatDate(job.created_at)}</p>
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

export default StudentJobs;
