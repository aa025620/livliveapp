import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Star, Smartphone } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-orange-500 bg-clip-text text-transparent">
                FOMO Events
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Discover amazing local events before they're gone. Never miss out on the experiences that matter.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white px-8 py-4 text-lg font-semibold glow-primary"
                onClick={() => window.location.href = "/api/login"}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose FOMO Events?
            </h2>
            <p className="text-lg text-muted-foreground">
              The smartest way to discover and attend local events
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Calendar className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-xl">Real-Time Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access live event data from Ticketmaster and SeatGeek. Sports, concerts, theater, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <MapPin className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-xl">Location-Based</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find events near you with intelligent radius filtering and geolocation support.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-xl">Social Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Save events, share with friends, and see what's trending in your area.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Star className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-xl">Smart Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Filter by category, price, date, and location to find exactly what you're looking for.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Smartphone className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-xl">Mobile-First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Optimized for iOS and Android with TikTok-style scrolling and touch-friendly design.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-urgent rounded-lg flex items-center justify-center mb-4">
                  🔥
                </div>
                <CardTitle className="text-xl">FOMO Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get notified about trending events and limited-time opportunities before they sell out.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-r from-primary/10 via-transparent to-orange-500/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Stop Missing Out?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of users discovering amazing events in their area
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white px-12 py-4 text-lg font-semibold glow-primary"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign Up Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 FOMO Events. Built with ❤️ for event enthusiasts.</p>
        </div>
      </footer>
    </div>
  );
}