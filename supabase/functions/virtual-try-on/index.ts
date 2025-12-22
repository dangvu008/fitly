import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      console.error('Authentication failed:', authError?.message);
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting virtual try-on process...');
    console.log('Clothing items:', items.map(i => i.name).join(', '));

    // Build clothing description and image content for the prompt
    const clothingNames = items.map(i => i.name).join(', ');
    const clothingList = items.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n');

    // Use Lovable AI Gateway (try multiple prompt/model variants for robustness)
    const basePrompt = `VIRTUAL FASHION TRY-ON - STRICT IDENTITY PRESERVATION

CRITICAL RULES (MUST FOLLOW EXACTLY):

1. FACE & IDENTITY PRESERVATION (HIGHEST PRIORITY):
   - The FIRST IMAGE below is the TARGET PERSON. You MUST preserve their EXACT face, facial features, skin tone, hair, and expression.
   - Do NOT change, blend, or modify the face in any way.
   - The final image must show the SAME PERSON identifiable as in the first image.

2. BODY & POSE PRESERVATION:
   - Keep the EXACT same body pose, proportions, and positioning as the target person.
   - Keep the EXACT same background and lighting environment.

3. CLOTHING REPLACEMENT:
   - The subsequent images after the target person are CLOTHING ITEMS ONLY: ${clothingNames}
   - Extract ONLY the clothing/shoes/accessories from these reference images.
   - If a clothing image shows a mannequin or another person wearing it, IGNORE that body completely - extract ONLY the garment itself.
   - Dress the TARGET PERSON with these EXACT clothing items:
${clothingList}
   - Each clothing item must match its reference image exactly: same color, pattern, design, and style.

4. REALISTIC RENDERING:
   - Apply natural fabric physics: proper draping, wrinkles, folds based on body pose.
   - Match lighting and shadows to the original photo environment.
   - The result must look like a genuine photograph, not a composite.

OUTPUT: Generate ONE photorealistic image of the TARGET PERSON wearing ALL the specified clothing items.`;

    // Build content array with body image first (emphasized as target), then all clothing images
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: basePrompt },
      { type: "text", text: "=== TARGET PERSON (PRESERVE THIS FACE AND BODY EXACTLY) ===" },
      { type: "image_url", image_url: { url: bodyImage } },
      { type: "text", text: "=== CLOTHING ITEMS TO APPLY (EXTRACT GARMENTS ONLY) ===" },
    ];

    // Add each clothing item with clear labeling
    items.forEach((item, idx) => {
      contentArray.push({ type: "text", text: `ITEM ${idx + 1}: ${item.name} (use this exact garment)` });
      contentArray.push({ type: "image_url", image_url: { url: item.imageUrl } });
    });

    const attempts: Array<{ model: string }> = [
      { model: "google/gemini-3-pro-image-preview" },
      { model: "google/gemini-2.5-flash" },
    ];

    let lastTextResponse: string | undefined;

    for (let i = 0; i < attempts.length; i++) {
      const { model } = attempts[i];
      console.log(`AI attempt ${i + 1}/${attempts.length} with model:`, model);

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
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);

        // Surface these to the client as JSON (avoid non-2xx so the client can read the message)
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ success: false, code: 429, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, code: 402, error: 'Hết hạn mức sử dụng AI, vui lòng nạp thêm credits.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If the first model fails (e.g., 400), try the fallback model once.
        if (i < attempts.length - 1) {
          console.log('Retrying with fallback model due to non-OK response...');
          continue;
        }

        return new Response(
          JSON.stringify({ success: false, error: `AI Gateway error: ${response.status}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
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
            message: lastTextResponse || 'Đã tạo hình ảnh thử đồ thành công!',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('No image generated in response:', JSON.stringify(data));

      // If we have more attempts left, try again.
      if (i < attempts.length - 1) {
        console.log('No image returned; retrying with fallback model/prompt...');
        continue;
      }

      // Surface AI failure as a readable JSON response (non-2xx would hide body from the client SDK)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Không thể tạo hình ảnh thử đồ. Vui lòng thử lại.',
          textResponse: lastTextResponse,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Should never reach here
    return new Response(
      JSON.stringify({ success: false, error: 'Không thể tạo hình ảnh thử đồ. Vui lòng thử lại.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in virtual-try-on function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xử lý hình ảnh';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
