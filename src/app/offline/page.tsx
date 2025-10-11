import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageSquareText } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Offline Support</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Stay connected to Verdant Sentinel even without internet.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              IVR Support
            </CardTitle>
            <Phone className="h-8 w-8 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Access core features through our Interactive Voice Response (IVR) system. Get diagnoses and recommendations over the phone.
            </p>
            <div className="mt-4">
              <p className="font-semibold">Dial our support number:</p>
              <p className="text-2xl font-bold text-accent">+1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              SMS Fallback
            </CardTitle>
            <MessageSquareText className="h-8 w-8 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Receive text-based analysis results and basic recommendations directly to your mobile device via SMS.
            </p>
            <div className="mt-4">
              <p className="font-semibold">Text "ANALYZE" to:</p>
              <p className="text-2xl font-bold text-accent">+1 (555) 765-4321</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
