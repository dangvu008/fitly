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

    const { currentImage, instruction, clothingItems } = await req.json();

    if (!currentImage || !instruction) {
      return new Response(
        JSON.stringify({ error: 'Current image and instruction are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting image edit with instruction:', instruction);

    // Build the edit prompt
    const clothingNames = clothingItems?.map((i: { name: string }) => i.name).join(', ') || 'selected clothing items';
    
    const editPrompt = `IMAGE EDITING TASK - FIX VIRTUAL TRY-ON RESULT

CURRENT IMAGE: This is a virtual try-on result that needs correction.

USER FEEDBACK: "${instruction}"

INSTRUCTIONS:
1. Fix the issues mentioned by the user
2. Keep the person's face and identity EXACTLY the same
3. Clothing items to ensure are correct: ${clothingNames}
4. Make the result look natural and photorealistic
5. Shoes must be ON the feet, not beside the person
6. Colors must match the original clothing reference images

Apply the user's requested changes and output ONE corrected image.`;

    // Build content array with the current result image
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: editPrompt },
      { type: "text", text: "=== IMAGE TO EDIT ===" },
      { type: "image_url", image_url: { url: currentImage } },
    ];

    // Add clothing reference images if available
    if (clothingItems && clothingItems.length > 0) {
      contentArray.push({ type: "text", text: "=== CLOTHING REFERENCES (use these exact colors/designs) ===" });
      clothingItems.forEach((item: { imageUrl: string; name: string }, idx: number) => {
        contentArray.push({ type: "text", text: `ITEM ${idx + 1}: ${item.name}` });
        contentArray.push({ type: "image_url", image_url: { url: item.imageUrl } });
      });
    }

    console.log('Calling AI for image edit...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
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

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Hết hạn mức sử dụng AI, vui lòng nạp thêm credits.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `AI Gateway error: ${response.status}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Safely parse response
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from AI Gateway');
      return new Response(
        JSON.stringify({ success: false, error: 'AI trả về kết quả rỗng. Vui lòng thử lại.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Không thể đọc kết quả từ AI. Vui lòng thử lại.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = data.choices?.[0]?.message;
    const generatedImage = message?.images?.[0]?.image_url?.url;

    if (generatedImage) {
      console.log('Image edit completed successfully');
      return new Response(
        JSON.stringify({
          success: true,
          editedImage: generatedImage,
          message: message?.content || 'Đã chỉnh sửa thành công!',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('No image generated in edit response');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Không thể chỉnh sửa hình ảnh. Vui lòng thử lại.',
        textResponse: message?.content,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in edit-try-on-result function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi chỉnh sửa hình ảnh';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
