import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectedItem {
  name: string;
  category: string;
  color?: string;
  style?: string;
  confidence: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use OpenAI Vision API or similar to analyze the outfit
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      // Fallback: Return mock analysis if no API key
      console.log('No OpenAI API key, returning mock analysis');
      return new Response(
        JSON.stringify({
          items: getMockAnalysis(),
          source: 'mock'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a fashion expert AI that analyzes outfit images. 
            Identify each clothing item and accessory visible in the image.
            For each item, provide:
            - name: Vietnamese name of the item (e.g., "Áo sơ mi trắng", "Quần jean xanh")
            - category: one of [top, bottom, dress, shoes, accessory, outerwear, hat, bag, jewelry, other]
            - color: main color in Vietnamese (e.g., "trắng", "đen", "xanh navy")
            - style: style description in Vietnamese (e.g., "công sở", "casual", "thể thao")
            - confidence: your confidence level from 0 to 1
            
            Return ONLY a JSON array of items, no other text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this outfit image and identify all clothing items and accessories. Return as JSON array.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(
        JSON.stringify({
          items: getMockAnalysis(),
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({
          items: getMockAnalysis(),
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let items: DetectedItem[];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        items = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      items = getMockAnalysis();
    }

    return new Response(
      JSON.stringify({ items, source: 'ai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing outfit:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze outfit',
        items: getMockAnalysis(),
        source: 'error-fallback'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getMockAnalysis(): DetectedItem[] {
  // Return a reasonable mock analysis for demo purposes
  return [
    {
      name: 'Áo',
      category: 'top',
      color: 'không xác định',
      style: 'casual',
      confidence: 0.7
    },
    {
      name: 'Quần',
      category: 'bottom',
      color: 'không xác định',
      style: 'casual',
      confidence: 0.7
    },
    {
      name: 'Giày',
      category: 'shoes',
      color: 'không xác định',
      style: 'casual',
      confidence: 0.6
    }
  ];
}
