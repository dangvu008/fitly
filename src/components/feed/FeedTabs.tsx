import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Compass, Trophy } from 'lucide-react';
import { FeedTab } from '@/hooks/useCommunityFeed';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

/**
 * FeedTabs - Tab navigation for Community Feed
 * 
 * Three tabs:
 * - Following: Outfits from followed users
 * - Explore: All community outfits
 * - Ranking: Outfits sorted by likes
 * 
 * Requirements: 1.2
 */
export const FeedTabs = ({ activeTab, onTabChange }: FeedTabsProps) => {
  return (
    <div className="sticky top-14 z-30 bg-background border-b">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as FeedTab)}>
        <TabsList className="w-full h-12 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="following"
            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Following</span>
          </TabsTrigger>
          <TabsTrigger
            value="explore"
            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
          >
            <Compass size={16} />
            <span className="hidden sm:inline">Explore</span>
          </TabsTrigger>
          <TabsTrigger
            value="ranking"
            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
          >
            <Trophy size={16} />
            <span className="hidden sm:inline">Ranking</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
