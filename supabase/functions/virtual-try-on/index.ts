import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse } from '../_shared/cors.ts';
import { validateBase64Image, sanitizeErrorMessage } from '../_shared/validation.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { bodyImage, clothingItems } = await req.json();

    // Support both single item (legacy) and multiple items
    const items: Array<{ imageUrl: string; name: string }> = clothingItems || [];

    if (!bodyImage || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Body image and at least one clothing item are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate body image
    const bodyValidation = validateBase64Image(bodyImage);
    if (!bodyValidation.valid) {
      return new Response(
        JSON.stringify({ error: bodyValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate clothing item images
    for (const item of items) {
      const itemValidation = validateBase64Image(item.imageUrl);
      if (!itemValidation.valid) {
        return new Response(
          JSON.stringify({ error: `Invalid clothing image: ${itemValidation.error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting virtual try-on process...');
    console.log('Clothing items:', items.map(i => i.name).join(', '));

    // Build clothing description and image content for the prompt
    const clothingNames = items.map(i => i.name).join(', ');
    const clothingList = items.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n');

    // Use Lovable AI Gateway with improved prompt for accuracy
    const basePrompt = `VIRTUAL CLOTHING TRY-ON — PIXEL-PERFECT ACCURACY

ABSOLUTE RULES (violating any = failure):

1. PERSON IDENTITY — DO NOT ALTER:
   - Face, hair style, hair color, skin tone, body proportions → copy exactly from the reference photo
   - Pose, posture, camera angle, lighting direction → keep identical
   - Background → preserve 100 % unchanged

2. GARMENT PLACEMENT — ANATOMICALLY CORRECT:
   - TOPS (áo, shirt, jacket, hoodie, blazer) → replace the person's current upper-body garment; align neckline, sleeves, hem naturally
   - BOTTOMS (quần, pants, skirt, shorts, jeans) → replace current lower-body garment; waistband at natural waist, hem at correct length
   - DRESSES (đầm, váy, dress) → replace both top and bottom; maintain silhouette from reference
   - SHOES (giày, sneaker, boot, sandal, dép) → MUST appear ON THE FEET, touching the ground, correct perspective
   - OUTERWEAR (áo khoác, coat) → layer OVER the inner top; do not hide inner garment unless it would be hidden naturally
   - ACCESSORIES (mũ, túi, belt, watch, necklace) → place on correct body part with proper scale

3. COLOR & PATTERN — EXACT MATCH:
   - Sample the DOMINANT COLOR directly from each clothing reference image
   - Reproduce every stripe, logo, print, texture, pattern at the correct scale and orientation
   - DO NOT average, tint, or shift any color — match the source image precisely
   - If the reference has metallic/shiny/matte finish, replicate that material quality

4. FIT & DRAPING — REALISTIC:
   - Fabric must follow the body's contours: wrinkles at elbows, knees, waist
   - Gravity-correct draping: skirts fall down, scarves hang, laces dangle
   - Proper occlusion: arms in front of torso hide part of the shirt, collar overlaps neck
   - Cast shadows from clothing onto body and vice-versa matching the scene's light source

5. MULTI-ITEM COHERENCE:
   - When multiple items are provided, combine them into ONE cohesive outfit
   - Layering order must be physically logical (underwear < shirt < jacket < coat)
   - Color palette should look intentional even if items are from different sources

CLOTHING TO APPLY: ${clothingNames}

Clothing list:
${clothingList}

OUTPUT: A single photorealistic image of the same person wearing ALL specified items. The result should be indistinguishable from a real photograph.`;

    // Build content array with body image first, then clothing images
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: basePrompt },
      { type: "text", text: "=== ORIGINAL PHOTO (keep this person's face and body) ===" },
      { type: "image_url", image_url: { url: bodyImage } },
      { type: "text", text: "=== CLOTHING ITEMS (apply these to the person) ===" },
    ];

    // Add clothing items with more specific instructions
    items.forEach((item, idx) => {
      const itemType = item.name.toLowerCase();
      let placement = "wear on body";
      if (itemType.includes('giày') || itemType.includes('shoe') || itemType.includes('sneaker') || itemType.includes('boot')) {
        placement = "MUST BE WORN ON THE FEET - not beside or floating";
      } else if (itemType.includes('áo') || itemType.includes('shirt') || itemType.includes('top') || itemType.includes('jacket')) {
        placement = "replace current top clothing";
      } else if (itemType.includes('quần') || itemType.includes('pant') || itemType.includes('short') || itemType.includes('jean')) {
        placement = "replace current bottom clothing";
      }
      contentArray.push({ type: "text", text: `ITEM ${idx + 1}: "${item.name}" - ${placement}. Use EXACT color from this image:` });
      contentArray.push({ type: "image_url", image_url: { url: item.imageUrl } });
    });

    // Use more capable model first for better accuracy
    const attempts: Array<{ model: string }> = [
      { model: "google/gemini-3-pro-image-preview" },
      { model: "google/gemini-2.5-flash-image-preview" },
    ];

    let lastTextResponse: string | undefined;

    for (let i = 0; i < attempts.length; i++) {
      const { model } = attempts[i];
      console.log(`AI attempt ${i + 1}/${attempts.length}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: contentArray,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        console.error('AI processing error:', response.status);

        // Surface these to the client as JSON
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ success: false, code: 429, error: 'Too many requests, please try again later' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, code: 402, error: 'Service quota exceeded' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If the first model fails, try the fallback model once.
        if (i < attempts.length - 1) {
          console.log('Retrying with fallback...');
          continue;
        }

        return new Response(
          JSON.stringify({ success: false, error: 'Image processing failed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Safely parse response body
      const responseText = await response.text();
      console.log('Raw response length:', responseText.length);
      
      if (!responseText || responseText.trim() === '') {
        console.error('Empty response');
        if (i < attempts.length - 1) {
          console.log('Retrying with fallback...');
          continue;
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Empty response from AI, please try again' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response');
        if (i < attempts.length - 1) {
          console.log('Retrying with fallback...');
          continue;
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Unable to process AI response, please try again' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const message = data.choices?.[0]?.message;

      console.log('AI response structure:', JSON.stringify({
        hasChoices: !!data.choices,
        messageKeys: message ? Object.keys(message) : [],
        hasImages: !!message?.images,
        imageCount: message?.images?.length || 0,
      }));

      const generatedImage = message?.images?.[0]?.image_url?.url;
      lastTextResponse = message?.content;

      if (generatedImage) {
        console.log('Virtual try-on completed successfully');
        return new Response(
          JSON.stringify({
            success: true,
            generatedImage,
            message: 'Try-on image generated successfully!',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('No image generated in response');
      
      // Check for specific error messages in the response
      const errorContent = message?.content?.toLowerCase() || '';
      const refusalReason = data.choices?.[0]?.finish_reason;
      
      // Detect common failure reasons
      if (errorContent.includes('person') || errorContent.includes('human') || errorContent.includes('body') || refusalReason === 'content_filter') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Could not detect person in image. Please upload a clear full-body photo.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If we have more attempts left, try again.
      if (i < attempts.length - 1) {
        console.log('No image returned; retrying...');
        continue;
      }

      // Surface AI failure as a readable JSON response
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to generate try-on image. Please try again.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Should never reach here
    return new Response(
      JSON.stringify({ success: false, error: 'Unable to generate try-on image. Please try again.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in virtual-try-on function:', error);
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
