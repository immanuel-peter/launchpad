"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, X, Plus, Save, Sparkles } from "lucide-react";

interface CreateEditJobProps {
  jobId?: string;
}

const CreateEditJob = ({ jobId }: CreateEditJobProps) => {
  const router = useRouter();
  const isEditing = !!jobId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("remote");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [compensation, setCompensation] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const [parsingRequirements, setParsingRequirements] = useState(false);
  const [parsingSkills, setParsingSkills] = useState(false);

  useEffect(() => {
    fetchCompany();
    if (isEditing) {
      fetchJob();
    }
  }, [jobId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/companies/me");
      if (!response.ok) return;
      const data = await response.json();
      setCompanyId(data.id);
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const fetchJob = async () => {
    if (!jobId) {
      setFetching(false);
      return;
    }

    setFetching(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) throw new Error("Failed to fetch job");
      const data = await response.json();

      setTitle(data.title || "");
      setDescription(data.description || "");
      setLocationType(data.location_type || "remote");
      setLocation(data.location || "");
      setDuration(data.duration || "");
      setCompensation(data.compensation || "");
      setRequirements(data.requirements || []);
      setSkills(data.skills_required || []);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job");
    } finally {
      setFetching(false);
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const mergeUnique = (base: string[], incoming: string[]) => {
    const seen = new Set(base.map((item) => item.toLowerCase()));
    const merged = [...base];
    for (const item of incoming) {
      const normalized = item.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(normalized);
      }
    }
    return merged;
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleParseRequirements = async () => {
    if (!description.trim()) {
      toast.error("Add a job description first");
      return;
    }

    setParsingRequirements(true);
    try {
      const response = await fetch("/api/jobs/parse-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to parse requirements" }));
        throw new Error(error.message || "Failed to parse requirements");
      }
      const data = (await response.json()) as { requirements: string[] };
      setRequirements(mergeUnique(requirements, data.requirements || []));
      toast.success("Requirements updated from description");
    } catch (error) {
      console.error("Error parsing requirements:", error);
      toast.error(error instanceof Error ? error.message : "Failed to parse requirements");
    } finally {
      setParsingRequirements(false);
    }
  };

  const handleParseSkills = async () => {
    if (!description.trim()) {
      toast.error("Add a job description first");
      return;
    }

    setParsingSkills(true);
    try {
      const response = await fetch("/api/jobs/parse-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to parse skills" }));
        throw new Error(error.message || "Failed to parse skills");
      }
      const data = (await response.json()) as { skills: string[] };
      setSkills(mergeUnique(skills, data.skills || []));
      toast.success("Required skills updated from description");
    } catch (error) {
      console.error("Error parsing skills:", error);
      toast.error(error instanceof Error ? error.message : "Failed to parse skills");
    } finally {
      setParsingSkills(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Add a job title and description first");
      return;
    }

    setEnhancingDescription(true);
    try {
      const response = await fetch("/api/jobs/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to enhance description" }));
        throw new Error(error.message || "Failed to enhance description");
      }

      const data = (await response.json()) as { description?: string };
      if (data.description) {
        setDescription(data.description);
        toast.success("Job description enhanced!");
      }
    } catch (error) {
      console.error("Error enhancing description:", error);
      toast.error(error instanceof Error ? error.message : "Failed to enhance description");
    } finally {
      setEnhancingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("Company not found");
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        title: title.trim(),
        description: description.trim(),
        location_type: locationType,
        location: location.trim() || null,
        duration: duration.trim() || null,
        compensation: compensation.trim() || null,
        requirements: requirements.length > 0 ? requirements : null,
        skills_required: skills.length > 0 ? skills : null,
      };

      if (isEditing && jobId) {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });
        if (!response.ok) throw new Error("Failed to update job");
        toast.success("Job updated successfully!");
      } else {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });
        if (!response.ok) throw new Error("Failed to create job");
        toast.success("Job posted successfully!");
      }

      router.push("/startup/jobs");
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl space-y-8 animate-pulse">
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {isEditing ? "Edit Job Posting" : "Create New Job Posting"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "Update your job details" : "Fill in the details to post a new opportunity"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Job Details</CardTitle>
              <CardDescription>Basic information about the role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Frontend Developer Intern"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="description">Description *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleEnhanceDescription}
                    disabled={!title.trim() || !description.trim() || enhancingDescription}
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  rows={6}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="locationType">Location Type</Label>
                  <Select value={locationType} onValueChange={setLocationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (if applicable)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 3 months, Part-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation</Label>
                  <Input
                    id="compensation"
                    value={compensation}
                    onChange={(e) => setCompensation(e.target.value)}
                    placeholder="e.g., $20/hr, $2000/month, Unpaid"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-display">Requirements</CardTitle>
                <CardDescription>What you're looking for in candidates</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParseRequirements}
                disabled={!description.trim() || parsingRequirements}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {parsingRequirements ? "Parsing..." : "Parse Description"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                />
                <Button type="button" variant="outline" onClick={handleAddRequirement}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {requirements.length > 0 && (
                <ul className="space-y-2">
                  {requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1">{req}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="p-1 rounded-full hover:bg-muted-foreground/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-display">Required Skills</CardTitle>
                <CardDescription>Technical and soft skills needed</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParseSkills}
                disabled={!description.trim() || parsingSkills}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {parsingSkills ? "Parsing..." : "Parse Description"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., React, Python, Communication)"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" variant="outline" onClick={handleAddSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      {skill}
                      <button
                        type="button"
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

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : isEditing ? "Update Job" : "Post Job"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateEditJob;
