import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, MapPin, Star, LogOut } from "lucide-react";
import { Link } from "wouter";
import type { User as UserType } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();

  if (!user) return null;

  const userData = user as UserType;

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={userData.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-white text-lg">
                {getInitials(userData.firstName, userData.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {userData.firstName || 'there'}!
              </h1>
              <p className="text-muted-foreground">
                Ready to discover amazing events?
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/api/logout"}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/events">
            <Card className="cursor-pointer card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Browse Events</h3>
                <p className="text-sm text-muted-foreground">Discover local events</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/map">
            <Card className="cursor-pointer card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Event Map</h3>
                <p className="text-sm text-muted-foreground">View on map</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/saved">
            <Card className="cursor-pointer card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Saved Events</h3>
                <p className="text-sm text-muted-foreground">Your favorites</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="cursor-pointer card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <User className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Profile</h3>
                <p className="text-sm text-muted-foreground">Manage account</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Welcome Message */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">
              🎉 Welcome to FOMO Events!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You now have access to thousands of live events from multiple sources including Ticketmaster and SeatGeek.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">What you can do:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Browse events by category (Sports, Entertainment, Arts, etc.)</li>
                <li>• Filter events by location and distance</li>
                <li>• Save your favorite events</li>
                <li>• Get real-time updates on trending events</li>
                <li>• Access events from multiple platforms</li>
              </ul>
            </div>

            <Link href="/events">
              <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white">
                Start Exploring Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}