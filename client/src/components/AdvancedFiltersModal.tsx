import { useState } from "react";
import { X, Calendar, Clock, DollarSign, MapPin, Filter, RotateCcw, Ticket } from "lucide-react";
import { categories, type CategoryId, type EventFilters, defaultFilters, ticketProviders } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  onApplyFilters: () => void;
}

export function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
}: AdvancedFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);

  const handleCategoryToggle = (categoryId: CategoryId) => {
    setLocalFilters(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories.filter(id => id !== 'all'), categoryId];
      
      // If no categories selected, default to 'all'
      if (newCategories.length === 0) {
        newCategories.push('all');
      }
      
      // If 'all' is selected, remove other categories
      if (categoryId === 'all') {
        return { ...prev, categories: ['all'] };
      }
      
      return { ...prev, categories: newCategories };
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: { min: values[0], max: values[1] }
    }));
  };

  const handleRadiusChange = (values: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      radius: values[0]
    }));
  };

  const handleTicketProviderToggle = (provider: string) => {
    setLocalFilters(prev => {
      const newProviders = prev.ticketProviders.includes(provider)
        ? prev.ticketProviders.filter(p => p !== provider)
        : [...prev.ticketProviders, provider];
      
      return { ...prev, ticketProviders: newProviders };
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      ...defaultFilters,
      dateRange: {
        start: new Date(), // Always reset to today
      },
    };
    setLocalFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.categories.length > 1 || !localFilters.categories.includes('all')) count++;
    if (localFilters.dateRange.start || localFilters.dateRange.end) count++;
    if (localFilters.timeRange.start || localFilters.timeRange.end) count++;
    if (localFilters.priceRange.min !== undefined || localFilters.priceRange.max !== undefined) count++;
    if (localFilters.ticketProviders.length > 0) count++;
    if (localFilters.radius !== undefined) count++;
    if (localFilters.showOnlyFree) count++;
    if (localFilters.showOnlyToday) count++;
    if (localFilters.showOnlyWeekend) count++;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">
          Customize your event search with advanced filtering options
        </p>

        <div className="space-y-6">
          {/* Quick Demo Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Demo Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalFilters({ ...defaultFilters, showOnlyFree: true })}
                className="text-xs"
              >
                Show Free Events
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalFilters({ ...defaultFilters, showOnlyWeekend: true })}
                className="text-xs"
              >
                Weekend Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalFilters({ ...defaultFilters, categories: ['entertainment', 'arts'] })}
                className="text-xs"
              >
                Entertainment + Arts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalFilters({ ...defaultFilters, priceRange: { min: 0, max: 50 } })}
                className="text-xs"
              >
                Under $50
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category.id}
                  variant={localFilters.categories.includes(category.id) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={localFilters.dateRange.start?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : new Date() }
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={localFilters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : undefined }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="time"
                  value={localFilters.timeRange.start || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    timeRange: { ...prev.timeRange, start: e.target.value || undefined }
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="time"
                  value={localFilters.timeRange.end || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    timeRange: { ...prev.timeRange, end: e.target.value || undefined }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Range
            </Label>
            <div className="px-2">
              <Slider
                min={0}
                max={200}
                step={5}
                value={[localFilters.priceRange.min || 0, localFilters.priceRange.max || 200]}
                onValueChange={handlePriceRangeChange}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>${localFilters.priceRange.min || 0}</span>
                <span>${localFilters.priceRange.max || 200}</span>
              </div>
            </div>
          </div>

          {/* Ticket Providers */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Ticket Providers
            </Label>
            <div className="flex flex-wrap gap-2">
              {ticketProviders.map((provider) => {
                const isActive = localFilters.ticketProviders.includes(provider);
                return (
                  <Button
                    key={provider}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTicketProviderToggle(provider)}
                    className={`
                      text-xs transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'hover:bg-primary/10 border-border'
                      }
                    `}
                  >
                    {provider}
                    {isActive && <span className="ml-1">✓</span>}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to show events from all ticket providers
            </p>
          </div>

          {/* Radius */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Search Radius
            </Label>
            <div className="px-2">
              <Slider
                min={1}
                max={50}
                step={1}
                value={[localFilters.radius || 10]}
                onValueChange={handleRadiusChange}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>1 km</span>
                <span className="font-medium">{localFilters.radius || 10} km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sort By</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={localFilters.sortBy}
                onValueChange={(value: 'date' | 'distance' | 'popularity' | 'price') => 
                  setLocalFilters(prev => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={localFilters.sortOrder}
                onValueChange={(value: 'asc' | 'desc') => 
                  setLocalFilters(prev => ({ ...prev, sortOrder: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="free-only" className="text-sm">Free events only</Label>
                <Switch
                  id="free-only"
                  checked={localFilters.showOnlyFree || false}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, showOnlyFree: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="today-only" className="text-sm">Today only</Label>
                <Switch
                  id="today-only"
                  checked={localFilters.showOnlyToday || false}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, showOnlyToday: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekend-only" className="text-sm">Weekend only</Label>
                <Switch
                  id="weekend-only"
                  checked={localFilters.showOnlyWeekend || false}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, showOnlyWeekend: checked }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}