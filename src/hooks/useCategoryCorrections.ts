import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Simple hash function to create image fingerprint
const generateImageHash = (imageBase64: string): string => {
  // Use a portion of the base64 string for hashing
  const sample = imageBase64.slice(0, 1000) + imageBase64.slice(-1000);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export const useCategoryCorrections = () => {
  const { user } = useAuth();

  // Save user correction when they manually select a category
  const saveCorrection = async (
    imageBase64: string,
    aiPredictedCategory: string | null,
    userSelectedCategory: string,
    imageFeatures?: {
      color?: string;
      pattern?: string;
      style?: string;
      subcategory?: string;
    }
  ) => {
    if (!user) return false;

    try {
      const imageHash = generateImageHash(imageBase64);
      
      const { error } = await supabase
        .from('category_corrections')
        .insert({
          user_id: user.id,
          image_hash: imageHash,
          ai_predicted_category: aiPredictedCategory,
          user_selected_category: userSelectedCategory,
          image_features: imageFeatures || {},
        });

      if (error) {
        console.error('Error saving category correction:', error);
        return false;
      }

      console.log('Category correction saved for AI learning');
      return true;
    } catch (error) {
      console.error('Error saving category correction:', error);
      return false;
    }
  };

  // Get learning statistics for debugging/display
  const getLearningStats = async () => {
    try {
      const { data, error } = await supabase
        .from('category_corrections')
        .select('user_selected_category, ai_predicted_category');

      if (error) throw error;

      const stats = {
        totalCorrections: data?.length || 0,
        categoryBreakdown: {} as Record<string, number>,
        aiMistakes: {} as Record<string, number>,
      };

      data?.forEach(correction => {
        // Count user selections
        const category = correction.user_selected_category;
        stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;

        // Count AI mistakes
        if (correction.ai_predicted_category && correction.ai_predicted_category !== category) {
          const mistake = `${correction.ai_predicted_category} -> ${category}`;
          stats.aiMistakes[mistake] = (stats.aiMistakes[mistake] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting learning stats:', error);
      return null;
    }
  };

  return {
    saveCorrection,
    getLearningStats,
  };
};
