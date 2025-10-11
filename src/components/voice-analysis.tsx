"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { processVoiceInput } from "@/ai/flows/process-voice-input";
import { improveRecommendationsWithFeedback } from "@/ai/flows/improve-recommendations-with-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, StopCircle, ThumbsUp, ThumbsDown, Bot, AlertTriangle, Sparkles, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { addToHistory } from "@/lib/history";

type VoiceResult = {
  textOutput: string;
};

export function VoiceAnalysis() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [originalRecommendation, setOriginalRecommendation] = useState("");
  const [improvedRecommendation, setImprovedRecommendation] = useState<string | null>(null);
  const [language, setLanguage] = useState("en-US");

  useEffect(() => {
    if(typeof window !== 'undefined' && window.navigator) {
        setLanguage(navigator.language || 'en-US');
    }
  }, []);

  const startRecording = async () => {
    setAnalysisResult(null);
    setError(null);
    setImprovedRecommendation(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        setIsRecording(true);

        const audioChunks: Blob[] = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          setAudioBlob(audioBlob);
          handleAnalyze(audioBlob);
        };
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Could not access microphone. Please check permissions.");
      }
    } else {
      setError("Audio recording is not supported by your browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      
      startTransition(async () => {
        setError(null);
        try {
          const result = await processVoiceInput({
            voiceDataUri: base64Audio,
            language: language,
          });
          setAnalysisResult(result);
          addToHistory({ type: 'voice', input: base64Audio, output: result, date: new Date().toISOString() });
        } catch (e) {
          console.error(e);
          setError("Failed to process voice input. Please try again.");
          toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "An error occurred during voice analysis.",
          });
        }
      });
    };
  };

  const handleFeedback = (isGood: boolean) => {
    if (isGood) {
      toast({
        title: "Feedback Received",
        description: "Thank you for helping us improve!",
      });
    } else {
      if (analysisResult?.textOutput) {
        setOriginalRecommendation(analysisResult.textOutput);
        setShowFeedbackDialog(true);
      }
    }
  };
  
  const submitFeedback = () => {
    if(!feedbackText) return;

    startTransition(async () => {
      try {
        const result = await improveRecommendationsWithFeedback({
          plantName: "the user's plant",
          recommendation: originalRecommendation,
          feedback: feedbackText
        });
        setImprovedRecommendation(result.improvedRecommendation);
        setShowFeedbackDialog(false);
        setFeedbackText("");
        toast({
          title: "Recommendation Improved",
          description: "We've updated the recommendation based on your feedback.",
        });
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Feedback Failed",
          description: "Could not process feedback. Please try again.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isPending}
          size="lg"
          className="w-48"
        >
          {isRecording ? (
            <>
              <StopCircle className="mr-2 h-5 w-5 animate-pulse" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Languages className="h-4 w-4"/> Language: {language}</p>
      </div>

      {isPending && (
         <div className="space-y-4 pt-4 text-left">
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="space-y-4 pt-4 text-left">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Bot className="w-6 h-6 text-primary"/>
                <CardTitle>AI Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{analysisResult.textOutput}</p>
            </CardContent>
          </Card>

          {improvedRecommendation && (
            <Alert variant="default" className="bg-secondary">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle>Improved Recommendation</AlertTitle>
              <AlertDescription>
                {improvedRecommendation}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-2 pt-4">
            <span className="text-sm text-muted-foreground">Was this helpful?</span>
            <Button variant="outline" size="icon" onClick={() => handleFeedback(true)}>
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleFeedback(false)}>
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Help us improve our recommendations. What was wrong or could be better?
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="e.g., The advice was too generic..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
            <Button onClick={submitFeedback} disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
