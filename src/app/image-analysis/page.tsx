import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageAnalysis } from "@/components/image-analysis";

export default function ImageAnalysisPage() {
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Plant Disease Detection</CardTitle>
        <CardDescription>Upload an image of your plant to detect diseases and get treatment recommendations.</CardDescription>
      </CardHeader>
      <CardContent>
        <ImageAnalysis />
      </CardContent>
    </Card>
  );
}
