"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { getHistoryItem, type AnalysisRecord } from "@/lib/history";
import { generateHealthReport } from "@/ai/flows/generate-health-report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useParams } from "next/navigation";
import { Stethoscope, Pilcrow, Sparkles, AlertTriangle, FileText, HeartPulse, ListTree, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type HealthReport = {
  overallHealth: string;
  potentialIssues: string;
  recommendations: string;
};

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [item, setItem] = useState<AnalysisRecord | null | undefined>(undefined);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (params.id) {
      setItem(getHistoryItem(params.id));
    }
  }, [params.id]);

  const handleGenerateReport = () => {
    if (!item) return;

    startTransition(async () => {
        setError(null);
        setReport(null);
      try {
        const result = await generateHealthReport({
          plantName: "User's Plant",
          plantDescription: "A plant from the user's history.",
          historicalData: JSON.stringify(item.output),
        });
        setReport(result);
        setShowReportDialog(true);
      } catch (e) {
        console.error(e);
        setError("Failed to generate health report. Please try again.");
        toast({
          variant: "destructive",
          title: "Report Generation Failed",
          description: "An error occurred while generating the report.",
        });
      }
    });
  };

  if (item === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (item === null) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analysis Details</h2>
        <Button onClick={handleGenerateReport} disabled={isPending}>
            <FileText className="mr-2 h-4 w-4"/>
            {isPending ? "Generating..." : "Generate Health Report"}
        </Button>
      </div>

       {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {item.type === "image" && (
        <div className="grid gap-6 md:grid-cols-2">
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Input Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                            <Image src={item.input} alt="Analysis input" layout="fill" objectFit="cover" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-primary"/>
                        <CardTitle>Diagnosis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{item.output.diagnosis}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Pilcrow className="w-6 h-6 text-primary"/>
                        <CardTitle>Treatment Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{item.output.treatmentRecommendations}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
      {item.type === "voice" && (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary"/>
                <CardTitle>AI Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
                <audio controls src={item.input} className="w-full mb-4"></audio>
                <p className="text-lg">{item.output.textOutput}</p>
            </CardContent>
        </Card>
      )}

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl"><FileText/> Health Report</DialogTitle>
            <DialogDescription>A comprehensive AI-generated health report for your plant.</DialogDescription>
          </DialogHeader>
          {report ? (
             <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-primary"/>
                        <CardTitle className="text-lg">Overall Health</CardTitle>
                    </CardHeader>
                    <CardContent><p>{report.overallHealth}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Activity className="w-5 h-5 text-primary"/>
                        <CardTitle className="text-lg">Potential Issues</CardTitle>
                    </CardHeader>
                    <CardContent><p>{report.potentialIssues}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <ListTree className="w-5 h-5 text-primary"/>
                        <CardTitle className="text-lg">Customized Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent><p className="whitespace-pre-wrap">{report.recommendations}</p></CardContent>
                </Card>
            </div>
          ) : (
             <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
