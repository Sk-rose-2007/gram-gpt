import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageAnalysis } from "@/components/image-analysis";
import { VoiceAnalysis } from "@/components/voice-analysis";
import { Camera, Mic } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-0">
      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image"><Camera className="mr-2" /> Image Analysis</TabsTrigger>
          <TabsTrigger value="voice"><Mic className="mr-2" /> Voice Input</TabsTrigger>
        </TabsList>
        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>Plant Disease Detection</CardTitle>
              <CardDescription>Upload an image of your plant to detect diseases and get treatment recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageAnalysis />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice-based Plant Care</CardTitle>
              <CardDescription>Use your voice to ask for plant care advice. Your language will be automatically detected.</CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceAnalysis />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
