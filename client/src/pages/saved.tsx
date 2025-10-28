import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useLocation } from "@/hooks/use-location";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
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
              <Bookmark className="h-8 w-8 text-secondary" />
              <h1 className="text-2xl font-bold text-foreground">Saved Events</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Your saved events will appear here. This would show events you've marked as interested.
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation 
        activeTab="saved"
        onLocationClick={() => {}}
        onRefreshClick={() => {}}
      />
    </div>
  );
}
