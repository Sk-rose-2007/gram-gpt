"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHistory, clearHistory, type AnalysisRecord } from "@/lib/history";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Mic, Calendar, Trash } from "lucide-react";
import { format } from "date-fns";

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setIsClient(true);
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="space-y-6">
      {history.length > 0 && (
        <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearHistory}>
                <Trash className="mr-2 h-4 w-4" />
                Clear History
            </Button>
        </div>
      )}
      {history.length === 0 ? (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>No History Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Perform an analysis from the dashboard to see your history here.</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => (
            <Link href={`/history/${item.id}`} key={item.id} className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {item.type === "image" ? <Camera /> : <Mic />}
                        Analysis
                      </CardTitle>
                       <CardDescription className="flex items-center gap-2 pt-2">
                        <Calendar className="h-4 w-4"/>
                        {format(new Date(item.date), "PPP p")}
                      </CardDescription>
                    </div>
                    {item.type === 'image' && (
                        <div className="relative w-24 h-16 rounded-md overflow-hidden">
                           <Image src={item.input} alt="Analysis input" layout="fill" objectFit="cover"/>
                        </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.type === 'image'
                      ? item.output.diagnosis
                      : item.output.textOutput}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
