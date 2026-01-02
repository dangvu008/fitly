import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse } from '../_shared/cors.ts';

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
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // TODO: Re-enable quota check when user_quotas table is created
    // For now, skip quota validation to allow virtual try-on to work

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

    // Use Lovable AI Gateway with improved prompt for accuracy
    const basePrompt = `VIRTUAL CLOTHING TRY-ON - STRICT ACCURACY REQUIRED

YOU MUST FOLLOW THESE RULES EXACTLY:

1. IDENTITY PRESERVATION (CRITICAL):
   - Keep the EXACT same face, hair, skin tone, body shape from the original photo
   - Keep the EXACT same pose and background

2. CLOTHING PLACEMENT (CRITICAL):
   - SHOES must be WORN ON THE FEET of the person, NOT floating or placed beside them
   - TOPS/SHIRTS must replace the current top the person is wearing
   - BOTTOMS/PANTS must replace the current bottom the person is wearing
   - ACCESSORIES must be worn properly (hats on head, bags on shoulder, etc.)

3. COLOR & DESIGN ACCURACY (CRITICAL):
   - Each clothing item MUST have the EXACT SAME COLOR as shown in its reference image
   - Each clothing item MUST have the EXACT SAME PATTERN/DESIGN as its reference
   - Do NOT change or blend colors - use the EXACT colors from the clothing reference images

4. REALISM:
   - Natural fabric draping and shadows
   - Proper perspective matching the body pose
   - Seamless integration - should look like a real photo

CLOTHING TO APPLY: ${clothingNames}

OUTPUT: Generate ONE photorealistic image showing the person WEARING all specified items correctly.`;

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

      // Safely parse response body
      const responseText = await response.text();
      console.log('Raw response length:', responseText.length);
      
      if (!responseText || responseText.trim() === '') {
        console.error('Empty response from AI Gateway');
        if (i < attempts.length - 1) {
          console.log('Retrying with fallback model due to empty response...');
          continue;
        }
        return new Response(
          JSON.stringify({ success: false, error: 'AI trả về kết quả rỗng. Vui lòng thử lại.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, 'Response:', responseText.substring(0, 500));
        if (i < attempts.length - 1) {
          console.log('Retrying with fallback model due to JSON parse error...');
          continue;
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Không thể đọc kết quả từ AI. Vui lòng thử lại.' }),
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
            message: lastTextResponse || 'Đã tạo hình ảnh thử đồ thành công!',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('No image generated in response:', JSON.stringify(data));
      
      // Check for specific error messages in the response
      const errorContent = message?.content?.toLowerCase() || '';
      const refusalReason = data.choices?.[0]?.finish_reason;
      
      // Detect common failure reasons
      if (errorContent.includes('person') || errorContent.includes('human') || errorContent.includes('body') || refusalReason === 'content_filter') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Không tìm thấy người trong ảnh. Vui lòng tải lên ảnh rõ nét hơn với người đứng thẳng, toàn thân.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
