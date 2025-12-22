import { cn } from "@/lib/utils";

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export const SkeletonGrid = ({ count = 9, className }: SkeletonGridProps) => {
  return (
    <div className={cn("grid grid-cols-3 gap-0.5", className)}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="aspect-square relative overflow-hidden bg-secondary"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* Placeholder content */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="h-3 w-16 rounded bg-muted-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonStories = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 flex flex-col items-center gap-1.5"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {/* Story ring skeleton */}
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-muted to-muted-foreground/20 animate-pulse">
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <div className="w-full h-full rounded-full bg-secondary relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            </div>
          </div>
          {/* Text skeleton */}
          <div className="h-3 w-12 rounded bg-secondary animate-pulse" />
        </div>
      ))}
      
      {/* Add button skeleton */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded bg-secondary animate-pulse" />
        </div>
        <div className="h-3 w-10 rounded bg-secondary animate-pulse" />
      </div>
    </div>
  );
};

export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-secondary", className)}>
      <div className="aspect-[3/4]">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted-foreground/10" />
        <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
      </div>
    </div>
  );
};
