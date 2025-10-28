import { categories, type CategoryId, type EventFilters } from "@shared/schema";
import { Music, Landmark, Volleyball, Palette, Users, Calendar, Grid3X3, MapPin } from "lucide-react";

interface CategoryFilterProps {
  activeCategories: CategoryId[];
  onCategoryChange: (categories: CategoryId[]) => void;
  categoryCounts: Record<string, number>;
  onAdvancedFiltersClick: () => void;
  onSearchClick?: () => void;
  activeFiltersCount: number;
  location?: { city: string; state: string };
  onLocationClick?: () => void;
}

const iconMap = {
  calendar: Calendar,
  music: Music,
  landmark: Landmark,
  futbol: Volleyball,
  palette: Palette,
  users: Users,
  grid: Grid3X3,
};

export function CategoryFilter({ 
  activeCategories, 
  onCategoryChange, 
  categoryCounts, 
  onAdvancedFiltersClick,
  onSearchClick,
  activeFiltersCount,
  location,
  onLocationClick
}: CategoryFilterProps) {
  const handleCategoryClick = (categoryId: CategoryId) => {
    // Single category selection - always select only the clicked category
    onCategoryChange([categoryId]);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 py-4">
      <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
        {/* Category Filter Section */}
        <div className="px-3 py-3">
          <div className="flex items-center justify-center space-x-1 max-w-full overflow-hidden">
            {categories.map((category) => {
              const Icon = iconMap[category.icon as keyof typeof iconMap] || Grid3X3;
              const isActive = activeCategories.includes(category.id);
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`
                    flex items-center justify-center p-4 touch-target relative
                    transition-all duration-200 hover:scale-105 rounded-xl min-w-0 flex-shrink-0
                    ${isActive 
                      ? 'text-primary drop-shadow-lg bg-primary/10' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                  title={category.label}
                >
                  <Icon className={`w-8 h-8 ${isActive ? 'glow-primary' : ''}`} />
                </button>
              );
            })}
            
          </div>
        </div>
      </div>
    </div>
  );
}
