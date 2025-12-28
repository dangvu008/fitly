import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a simple hash for cache key
function generateCacheKey(imageBase64: string): string {
  const sample = imageBase64.slice(0, 500) + imageBase64.slice(-500);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `body_${Math.abs(hash).toString(36)}`;
}

// Check cache for existing analysis
async function getFromCache(supabase: any, cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('result')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.log('Cache lookup error:', error);
      return null;
    }

    if (data) {
      console.log('Cache hit for body analysis');
      return data.result;
    }

    return null;
  } catch (err) {
    console.error('Cache error:', err);
    return null;
  }
}

// Save result to cache
async function saveToCache(supabase: any, cacheKey: string, result: any): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('ai_cache')
      .upsert({
        cache_key: cacheKey,
        cache_type: 'body_analysis',
        result: result,
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'cache_key' });

    console.log('Saved to cache:', cacheKey);
  } catch (err) {
    console.error('Failed to save to cache:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Analyzing body image...');

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheKey = generateCacheKey(imageBase64);
    const cachedResult = await getFromCache(supabase, cacheKey);
    
    if (cachedResult) {
      return new Response(
        JSON.stringify({ ...cachedResult, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Analyze this image and provide a JSON response with the following structure:
{
  "isPerson": boolean (true if there's a clearly visible person in the image),
  "isFullBody": boolean (true if the person's full body is visible from head to at least knees),
  "gender": "male" | "female" | "unknown",
  "quality": "good" | "acceptable" | "poor",
  "issues": string[] (list any issues like "too blurry", "too dark", "face not visible", "not a person", "cropped body", "multiple people", etc.)
}

Be strict about quality:
- "good": Clear, well-lit, single person with full body visible
- "acceptable": Minor issues but still usable for virtual try-on
- "poor": Too blurry, too dark, or major issues that would affect virtual try-on

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
        isPerson: false,
        isFullBody: false,
        gender: 'unknown',
        quality: 'poor',
        issues: ['Could not analyze image']
      };
    }

    // Save to cache (fire and forget)
    saveToCache(supabase, cacheKey, analysis).catch(err => console.error('Cache save error:', err));

    return new Response(
      JSON.stringify({ ...analysis, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-body-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});