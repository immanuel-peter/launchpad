"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Building2, ExternalLink, MapPin, Calendar, Users } from "lucide-react";

interface PublicCompanyProfile {
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

const PublicCompanyProfilePage = () => {
  const params = useParams<{ id: string }>();
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${params.id}`);
        if (!response.ok) {
          throw new Error("Company not found");
        }
        const data = (await response.json()) as PublicCompanyProfile;
        setCompany(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load company profile");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              {error || "Company not found"}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <Card className="border-0 shadow-md">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="font-display text-3xl mb-2">
                  {company.name}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground mb-4">
                  {[
                    company.industry,
                    company.location,
                    company.founded_year && `Founded ${company.founded_year}`,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  {company.industry && (
                    <Badge variant="secondary">{company.industry}</Badge>
                  )}
                  {company.company_size && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {company.company_size}
                    </Badge>
                  )}
                  {company.location && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {company.location}
                    </Badge>
                  )}
                  {company.founded_year && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {company.founded_year}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {company.description && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="font-display">About {company.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                <ReactMarkdown>{company.description}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {company.website && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Company Website
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicCompanyProfilePage;
