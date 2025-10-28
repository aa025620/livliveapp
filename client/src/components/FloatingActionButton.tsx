import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function FloatingActionButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreateEvent = () => {
    // In a real app, this would open a create event modal or navigate to a create page
    console.log("Create event clicked");
  };

  const handleSearch = () => {
    // Open search functionality
    console.log("Search clicked");
    // This could trigger a search modal or navigate to search page
  };

  return (
    <div className="fixed bottom-24 right-4 flex flex-col gap-2">
      <Button
        onClick={handleSearch}
        className="bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white w-12 h-12 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110 p-0 glow-secondary"
        title="Search Events"
      >
        <Search className="w-5 h-5 drop-shadow-lg" />
      </Button>
      <Button
        onClick={handleCreateEvent}
        className="bg-gradient-primary hover:opacity-90 text-white w-14 h-14 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110 p-0 glow-primary"
      >
        <Plus className="w-6 h-6 drop-shadow-lg" />
      </Button>
    </div>
  );
}
