"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Save, ExternalLink } from "lucide-react";

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  founded_year: number | null;
}

const CompanyProfile = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/companies/me");
      if (!response.ok) throw new Error("Failed to fetch company");
      const data = (await response.json()) as Company;

      setCompany(data);
      setName(data.name || "");
      setDescription(data.description || "");
      setWebsite(data.website || "");
      setIndustry(data.industry || "");
      setCompanySize(data.company_size || "");
      setLocation(data.location || "");
      setFoundedYear(data.founded_year?.toString() || "");
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id) return;

    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/companies/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          website: website.trim() || null,
          industry: industry || null,
          company_size: companySize || null,
          location: location.trim() || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update company");
      toast.success("Company profile updated!");
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Company Profile</h1>
            <p className="text-muted-foreground">
              Make your company stand out to potential candidates
            </p>
          </div>
          <div className="flex items-center gap-3">
            {company?.id && (
              <Link href={`/companies/${company.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Company
                </Button>
              </Link>
            )}
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Company Logo */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{name || "Your Company"}</h3>
                <p className="text-muted-foreground">{industry || "Industry not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Company Information</CardTitle>
            <CardDescription>Tell candidates about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Inc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">About the Company</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell students about your company's mission, culture, and what makes it a great place to work..."
                rows={5}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ai">AI / Machine Learning</SelectItem>
                    <SelectItem value="cleantech">Clean Tech</SelectItem>
                    <SelectItem value="social">Social Impact</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501+">501+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Headquarters Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundedYear">Founded Year</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="2020"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfile;
