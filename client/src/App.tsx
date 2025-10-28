import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SimpleEventsPage from "@/pages/simple-events";
import MapPage from "@/pages/map";
import SavedPage from "@/pages/saved";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleEventsPage} />
      <Route path="/events" component={SimpleEventsPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/saved" component={SavedPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-transparent">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
