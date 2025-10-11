"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, RefreshCw } from "lucide-react";

export default function SettingsPage() {
    const { toast } = useToast();

    const handleCheckForUpdates = () => {
        toast({
            title: "Up to Date",
            description: "Verdant Sentinel is already running the latest version.",
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Application Updates</CardTitle>
                    <CardDescription>
                        Check for the latest version of Verdant Sentinel to ensure you have the newest features and improvements.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Button onClick={handleCheckForUpdates}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Check for Updates
                        </Button>
                        <p className="text-sm text-muted-foreground">Current version: 1.0.0</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                        Manage your notification preferences (feature coming soon).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Bell className="h-5 w-5" />
                        <span>Notification settings will appear here.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
