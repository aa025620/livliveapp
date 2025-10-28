import { type Event } from "@shared/schema";

interface TrendingAlertProps {
  event: Event;
}

export function TrendingAlert({ event }: TrendingAlertProps) {
  return (
    <div className="bg-gradient-urgent text-white p-3 m-4 rounded-lg shadow-lg animate-pulse-slow glow-urgent">
      <div className="flex items-center space-x-2">
        <span className="text-white animate-bounce-gentle drop-shadow-sm">🔥</span>
        <p className="text-sm font-semibold drop-shadow-sm">Trending Now</p>
      </div>
      <p className="text-xs mt-1 drop-shadow-sm">
        {event.title} - {event.attendeeCount} people interested!
      </p>
    </div>
  );
}
