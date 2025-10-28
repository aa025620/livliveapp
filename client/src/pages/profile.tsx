import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useLocation } from "@/hooks/use-location";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { location } = useLocation("user-123");

  return (
    <div className="min-h-screen bg-transparent">
      <AppHeader 
        location={location} 
        onLocationClick={() => {}}
        notificationCount={3}
      />
      
      <main className="pb-20 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              User profile and settings will be implemented here. This would include preferences, notification settings, and account management.
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation 
        activeTab="profile"
        onLocationClick={() => {}}
        onRefreshClick={() => {}}
      />
    </div>
  );
}
