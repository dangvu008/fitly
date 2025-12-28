import { Gem, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserGems } from '@/hooks/useUserGems';
import { cn } from '@/lib/utils';

interface GemsCounterProps {
  onPurchaseClick: () => void;
  className?: string;
  showAddButton?: boolean;
}

export function GemsCounter({ 
  onPurchaseClick, 
  className,
  showAddButton = true 
}: GemsCounterProps) {
  const { balance, isLoading } = useUserGems();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPurchaseClick}
        className="flex items-center gap-1.5 px-2 h-8 hover:bg-accent/50"
        aria-label={`${balance} gems. Click to purchase more`}
      >
        <Gem className="h-4 w-4 text-purple-500" />
        <span className="font-medium text-sm">
          {isLoading ? '...' : balance}
        </span>
        {showAddButton && (
          <Plus className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
