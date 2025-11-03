"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { analyzeImageAndDetectDisease } from "@/ai/flows/analyze-image-and-detect-disease";
import { improveRecommendationsWithFeedback } from "@/ai/flows/improve-recommendations-with-feedback";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, AlertTriangle, UploadCloud, Stethoscope, Pilcrow, Sparkles, Languages, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { addToHistory } from "@/lib/history";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "./ui/progress";

type AnalysisResult = {
  diagnosis: string;
  treatmentRecommendations: string;
};

type AudioState = {
  diagnosisAudioUri?: string;
  treatmentAudioUri?: string;
  activeAudio?: 'diagnosis' | 'treatment';
  isPlaying: boolean;
  progress: number;
};

const supportedLanguages = [
    { value: "en-US", label: "English" },
    { value: "es-ES", label: "Spanish" },
    { value: "fr-FR", label: "French" },
    { value: "de-DE", label: "German" },
    { value: "hi-IN", label: "Hindi" },
    { value: "ja-JP", label: "Japanese" },
    { value: "zh-CN", label: "Chinese" },
    { value: "ta-IN", label: "Tamil" },
    { value: "pa-IN", label: "Punjabi" },
];

export function ImageAnalysis() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [originalRecommendation, setOriginalRecommendation] = useState("");
  const [improvedRecommendation, setImprovedRecommendation] = useState<string | null>(null);
  
  const [language, setLanguage] = useState("en-US");
  const [audioState, setAudioState] = useState<AudioState>({ isPlaying: false, progress: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
        setLanguage(navigator.language || 'en-US');
    }
    
    const audioEl = audioRef.current;
    const onAudioEnd = () => {
        setAudioState(prev => ({ ...prev, isPlaying: false, progress: 0, activeAudio: undefined }));
    };
    const onTimeUpdate = () => {
        if (audioEl && audioEl.duration > 0) {
            const progress = (audioEl.currentTime / audioEl.duration) * 100;
            setAudioState(prev => ({ ...prev, progress: progress }));
        }
    };

    if (audioEl) {
        audioEl.addEventListener('ended', onAudioEnd);
        audioEl.addEventListener('pause', onAudioEnd);
        audioEl.addEventListener('timeupdate', onTimeUpdate);
    }
    return () => {
        if (audioEl) {
            audioEl.removeEventListener('ended', onAudioEnd);
            audioEl.removeEventListener('pause', onAudioEnd);
            audioEl.removeEventListener('timeupdate', onTimeUpdate);
        }
    };
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
      setError(null);
      setImprovedRecommendation(null);
      setAudioState({ isPlaying: false, progress: 0 });
    }
  };

  const handleAnalyze = () => {
    if (!imagePreview || !imageFile) {
      toast({
        variant: "destructive",
        title: "No Image Selected",
        description: "Please select an image file to analyze.",
      });
      return;
    }

    startTransition(async () => {
      setError(null);
      setAnalysisResult(null);
      setImprovedRecommendation(null);
      setAudioState({ isPlaying: false, progress: 0 });
      try {
        const result = await analyzeImageAndDetectDisease({
          photoDataUri: imagePreview,
          description: "A user-uploaded plant image.",
        });
        setAnalysisResult(result);
        addToHistory({ type: 'image', input: imagePreview, output: result, date: new Date().toISOString() });

        // Generate audio for both parts
        const [diagnosisAudio, treatmentAudio] = await Promise.all([
            textToSpeech({ text: result.diagnosis, language }),
            textToSpeech({ text: result.treatmentRecommendations, language })
        ]);

        setAudioState(prev => ({
            ...prev,
            diagnosisAudioUri: diagnosisAudio.audioDataUri,
            treatmentAudioUri: treatmentAudio.audioDataUri,
        }));

      } catch (e) {
        console.error(e);
        setError("Failed to analyze image. Please try again.");
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "An error occurred during image analysis.",
        });
      }
    });
  };
  
  const handleFeedback = (isGood: boolean) => {
    if (isGood) {
      toast({
        title: "Feedback Received",
        description: "Thank you for helping us improve!",
      });
    } else {
      if (analysisResult?.treatmentRecommendations) {
        setOriginalRecommendation(analysisResult.treatmentRecommendations);
        setShowFeedbackDialog(true);
      }
    }
  };

  const toggleAudioPlayback = (type: 'diagnosis' | 'treatment') => {
      const audioUri = type === 'diagnosis' ? audioState.diagnosisAudioUri : audioState.treatmentAudioUri;
      if (!audioUri) return;
      
      const audioEl = audioRef.current;
      if (!audioEl) return;

      if (audioState.isPlaying && audioState.activeAudio === type) {
          audioEl.pause();
      } else {
          if(audioState.isPlaying) {
              audioEl.pause();
          }
          audioEl.src = audioUri;
          audioEl.play();
          setAudioState(prev => ({...prev, isPlaying: true, activeAudio: type, progress: 0 }));
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
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} className="hidden" />
      <div className="p-4 border-2 border-dashed rounded-lg text-center bg-card/50 space-y-4">
        <div className="flex justify-center">
            <UploadCloud className="w-12 h-12 text-muted-foreground"/>
        </div>
        {imagePreview ? (
          <div className="relative w-full max-w-md mx-auto aspect-video">
            <Image src={imagePreview} alt="Plant preview" layout="fill" objectFit="contain" className="rounded-md" />
          </div>
        ) : (
          <p className="text-muted-foreground">Select an image to see a preview</p>
        )}
        <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="max-w-sm mx-auto file:text-primary file:font-semibold"/>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-muted-foreground" />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        <Button onClick={handleAnalyze} disabled={isPending || !imageFile} className="w-full flex-1">
            {isPending ? "Analyzing..." : "Analyze Plant Image"}
        </Button>
      </div>

      {isPending && (
         <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-primary"/>
                    <CardTitle>Diagnosis</CardTitle>
                </div>
                {audioState.diagnosisAudioUri && (
                    <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 shrink-0 bg-primary/20 hover:bg-primary/30" onClick={() => toggleAudioPlayback('diagnosis')}>
                        {audioState.isPlaying && audioState.activeAudio === 'diagnosis' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="sr-only">Play Diagnosis</span>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
              <p>{analysisResult.diagnosis}</p>
              {audioState.diagnosisAudioUri && (
                  <div className="space-y-2 pt-4">
                    <Progress value={audioState.activeAudio === 'diagnosis' ? audioState.progress : 0} className="h-1 bg-primary/20" />
                  </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Pilcrow className="w-6 h-6 text-primary"/>
                    <CardTitle>Treatment Recommendations</CardTitle>
                </div>
                {audioState.treatmentAudioUri && (
                     <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 shrink-0 bg-primary/20 hover:bg-primary/30" onClick={() => toggleAudioPlayback('treatment')}>
                        {audioState.isPlaying && audioState.activeAudio === 'treatment' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="sr-only">Play Treatment</span>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
              <p>{analysisResult.treatmentRecommendations}</p>
              {audioState.treatmentAudioUri && (
                  <div className="space-y-2 pt-4">
                    <Progress value={audioState.activeAudio === 'treatment' ? audioState.progress : 0} className="h-1 bg-primary/20" />
                  </div>
              )}
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
            placeholder="e.g., This diagnosis seems incorrect because..."
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
