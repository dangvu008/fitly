import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const prompt = `Analyze this image and determine if it shows a clothing item or fashion accessory. Provide a JSON response with the following structure:
{
  "isClothing": boolean (true if image shows clothing, shoes, or fashion accessory),
  "category": "top" | "bottom" | "dress" | "shoes" | "accessory" | "unknown",
  "subcategory": string (e.g., "t-shirt", "jeans", "sneakers", "handbag", "necklace", etc.),
  "color": string (primary color of the item),
  "pattern": string (e.g., "solid", "striped", "floral", "checkered", "graphic", etc.),
  "quality": "good" | "acceptable" | "poor",
  "issues": string[] (list any issues like "too blurry", "multiple items", "not clothing", "partially visible", "bad lighting", etc.),
  "style": string (e.g., "casual", "formal", "sporty", "vintage", "streetwear", etc.),
  "gender": "male" | "female" | "unisex" | "unknown"
}

Category definitions:
- "top": shirts, t-shirts, blouses, sweaters, jackets, coats, hoodies
- "bottom": pants, jeans, shorts, skirts
- "dress": dresses, jumpsuits, rompers, overalls
- "shoes": all types of footwear
- "accessory": bags, hats, jewelry, scarves, belts, watches, sunglasses

Quality criteria:
- "good": Clear image, single item, good lighting, item fully visible
- "acceptable": Minor issues but item is recognizable
- "poor": Too blurry, bad lighting, item not clearly visible, or not a clothing item

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
