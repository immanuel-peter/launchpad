"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Info } from "lucide-react";

interface WorkflowSettings {
  id: string;
  email_on_decision: boolean;
  acceptance_email_body: string | null;
  rejection_email_body: string | null;
}

const WorkflowsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailOnDecision, setEmailOnDecision] = useState(false);
  const [acceptanceBody, setAcceptanceBody] = useState("");
  const [rejectionBody, setRejectionBody] = useState("");

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const response = await fetch("/api/workflows");
        if (!response.ok) {
          throw new Error("Failed to load workflows");
        }
        const data = (await response.json()) as WorkflowSettings;
        setEmailOnDecision(!!data.email_on_decision);
        setAcceptanceBody(data.acceptance_email_body || "");
        setRejectionBody(data.rejection_email_body || "");
      } catch (error) {
        console.error("Error fetching workflows:", error);
        toast.error("Failed to load workflows");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_on_decision: emailOnDecision,
          acceptance_email_body: acceptanceBody,
          rejection_email_body: rejectionBody,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflows");
      }

      toast.success("Workflow settings saved");
    } catch (error) {
      console.error("Error saving workflows:", error);
      toast.error("Failed to save workflows");
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
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Workflows</h1>
          <p className="text-muted-foreground">Automate candidate communication after decisions</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Decision Emails</CardTitle>
            <CardDescription>Send automated emails to applicants when accepted or rejected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <Checkbox
                id="emailOnDecision"
                checked={emailOnDecision}
                onCheckedChange={(checked) => setEmailOnDecision(checked === true)}
              />
              <Label htmlFor="emailOnDecision">Send email after acceptance or rejection</Label>
            </div>

            {emailOnDecision && (
              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Launchpad will automatically preface each email with information about the relevant position and company. 
                    Please write your email body as a standalone message that does not reference specific job titles or company names.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="acceptanceEmail">Acceptance Email Body</Label>
                  <Textarea
                    id="acceptanceEmail"
                    value={acceptanceBody}
                    onChange={(event) => setAcceptanceBody(event.target.value)}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejectionEmail">Rejection Email Body</Label>
                  <Textarea
                    id="rejectionEmail"
                    value={rejectionBody}
                    onChange={(event) => setRejectionBody(event.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="hero" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WorkflowsPage;
