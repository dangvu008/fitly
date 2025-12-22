import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch learning data from user corrections
async function getLearningContext(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return '';
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get recent corrections to learn from
    const { data: corrections, error } = await supabase
      .from('category_corrections')
      .select('ai_predicted_category, user_selected_category, image_features')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !corrections || corrections.length === 0) {
      return '';
    }

    // Build learning context from corrections
    const learningPatterns: Record<string, { correct: string; features: any[] }[]> = {};
    
    corrections.forEach((c: any) => {
      if (c.ai_predicted_category && c.user_selected_category && c.ai_predicted_category !== c.user_selected_category) {
        if (!learningPatterns[c.ai_predicted_category]) {
          learningPatterns[c.ai_predicted_category] = [];
        }
        learningPatterns[c.ai_predicted_category].push({
          correct: c.user_selected_category,
          features: c.image_features || {}
        });
      }
    });

    if (Object.keys(learningPatterns).length === 0) {
      return '';
    }

    // Create learning hints for the AI
    const hints: string[] = [];
    
    for (const [predicted, corrections] of Object.entries(learningPatterns)) {
      const correctCategories = corrections.map(c => c.correct);
      const mostCommonCorrect = correctCategories.sort((a, b) =>
        correctCategories.filter(v => v === a).length - correctCategories.filter(v => v === b).length
      ).pop();
      
      hints.push(`- When you think it's "${predicted}", double-check if it might be "${mostCommonCorrect}" instead (users corrected this ${corrections.length} times)`);
    }

    if (hints.length > 0) {
      return `\n\nLEARNING FROM USER CORRECTIONS:\n${hints.join('\n')}\n`;
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching learning context:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Analyzing clothing image...');

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get learning context from user corrections
    const learningContext = await getLearningContext();
    console.log('Learning context loaded:', learningContext ? 'Yes' : 'No');

    const prompt = `Analyze this image and determine if it shows a clothing item or fashion accessory suitable for virtual try-on. Provide a JSON response with the following structure:
{
  "isClothing": boolean (true if image shows clothing, shoes, or fashion accessory),
  "isFullyVisible": boolean (true if the item is fully spread out, opened, and completely visible - NOT folded, crumpled, or partially hidden),
  "isFolded": boolean (true if the clothing is folded, rolled up, or not in a displayable state),
  "category": "top" | "bottom" | "dress" | "shoes" | "accessory" | "unknown",
  "subcategory": string (e.g., "t-shirt", "jeans", "sneakers", "handbag", "necklace", etc.),
  "color": string (primary color of the item),
  "pattern": string (e.g., "solid", "striped", "floral", "checkered", "graphic", etc.),
  "quality": "good" | "acceptable" | "poor",
  "issues": string[] (list any issues),
  "style": string (e.g., "casual", "formal", "sporty", "vintage", "streetwear", etc.),
  "gender": "male" | "female" | "unisex" | "unknown"
}

CRITICAL CHECKS:
1. Is it clothing/accessory? If not, isClothing = false
2. Is the item FULLY SPREAD OUT and OPENED? 
   - For tops: Should be laid flat showing front/back, not folded
   - For pants: Should be laid flat showing full length, not folded
   - For dresses: Should be hung or laid flat, fully visible
   - For shoes: Should show the full shoe, not in a box
   - If folded, crumpled, stacked, or in packaging: isFolded = true, isFullyVisible = false

ISSUES to detect and add to the array:
- "folded" - Item is folded or rolled up
- "crumpled" - Item is wrinkled or crumpled in a pile
- "partially_visible" - Only part of the item is visible
- "in_packaging" - Item is still in packaging/box
- "multiple_items" - Multiple clothing items in one image
- "worn_by_person" - Item is being worn (not flat display)
- "too_blurry" - Image is too blurry
- "bad_lighting" - Poor lighting makes details hard to see
- "too_small" - Item appears too small/far away
- "not_clothing" - Not a clothing item or accessory
- "background_cluttered" - Too much background noise

Category definitions:
- "top": shirts, t-shirts, blouses, sweaters, jackets, coats, hoodies
- "bottom": pants, jeans, shorts, skirts
- "dress": dresses, jumpsuits, rompers, overalls
- "shoes": all types of footwear
- "accessory": bags, hats, jewelry, scarves, belts, watches, sunglasses

Quality criteria:
- "good": Clear image, single item fully opened/spread out, good lighting, white or clean background
- "acceptable": Minor issues but item is clearly recognizable and mostly visible
- "poor": Folded, blurry, bad lighting, item not clearly visible, or not clothing
${learningContext}
Only respond with the JSON object, nothing else.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response from AI
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      analysis = {
        isClothing: false,
        isFullyVisible: false,
        isFolded: false,
        category: 'unknown',
        subcategory: 'unknown',
        color: 'unknown',
        pattern: 'unknown',
        quality: 'poor',
        issues: ['Could not analyze image'],
        style: 'unknown',
        gender: 'unknown'
      };
    }

    console.log('Clothing analysis result:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-clothing-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
