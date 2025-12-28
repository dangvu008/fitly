import { Gem } from 'lucide-react';
import { useUserGems } from '@/hooks/useUserGems';
import { cn } from '@/lib/utils';

interface GemsCounterProps {
  onPurchaseClick: () => void;
  className?: string;
}

export function GemsCounter({ 
  onPurchaseClick, 
  className,
}: GemsCounterProps) {
  const { balance, isLoading } = useUserGems();

  return (
    <button
      onClick={onPurchaseClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-purple-100 dark:bg-purple-900/30',
        'hover:bg-purple-200 dark:hover:bg-purple-900/50',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label={`${balance} gems. Tap to purchase more`}
    >
      <Gem className="h-4 w-4 text-gem" />
      <span className="font-semibold text-sm text-gem">
        {isLoading ? '...' : balance}
      </span>
    </button>
  );
}
