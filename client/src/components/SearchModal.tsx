import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Calendar, DollarSign } from "lucide-react";

interface SearchFilters {
  query: string;
  category: string;
  priceRange: string;
  dateRange: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SearchFilters) => void;
}

export function SearchModal({ isOpen, onClose, onApplyFilters }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("any");
  const [selectedDateRange, setSelectedDateRange] = useState("any");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "entertainment", label: "Entertainment" },
    { value: "government", label: "Government" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts" },
    { value: "community", label: "Community" },
  ];

  const priceRanges = [
    { value: "any", label: "Any Price" },
    { value: "free", label: "Free" },
    { value: "0-50", label: "$0 - $50" },
    { value: "50-100", label: "$50 - $100" },
    { value: "100-200", label: "$100 - $200" },
    { value: "200+", label: "$200+" },
  ];

  const dateRanges = [
    { value: "any", label: "Any Date" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "this-week", label: "This Week" },
    { value: "this-weekend", label: "This Weekend" },
    { value: "next-week", label: "Next Week" },
    { value: "this-month", label: "This Month" },
  ];

  const handleApplyFilters = () => {
    const filters: SearchFilters = {
      query: searchQuery.trim(),
      category: selectedCategory,
      priceRange: selectedPriceRange,
      dateRange: selectedDateRange,
    };
    
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedPriceRange("");
    setSelectedDateRange("");
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory || selectedPriceRange || selectedDateRange;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-md border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Search className="w-5 h-5 text-primary" />
            Search & Filter Events
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Query */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Search Events</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by artist, team, venue, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 focus:border-primary pr-10"
                data-testid="input-search-events"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-black/50 border-white/20 text-white" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 text-white">
                {categories.map((category) => (
                  <SelectItem 
                    key={category.value} 
                    value={category.value}
                    className="text-white focus:bg-primary/20"
                  >
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Price Range
            </label>
            <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
              <SelectTrigger className="bg-black/50 border-white/20 text-white" data-testid="select-price-range">
                <SelectValue placeholder="Any Price" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 text-white">
                {priceRanges.map((range) => (
                  <SelectItem 
                    key={range.value} 
                    value={range.value}
                    className="text-white focus:bg-primary/20"
                  >
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="bg-black/50 border-white/20 text-white" data-testid="select-date-range">
                <SelectValue placeholder="Any Date" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 text-white">
                {dateRanges.map((range) => (
                  <SelectItem 
                    key={range.value} 
                    value={range.value}
                    className="text-white focus:bg-primary/20"
                  >
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
              data-testid="button-apply-search"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}