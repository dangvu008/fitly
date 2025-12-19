import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { bodyImage, clothingImage, clothingName } = await req.json();

    if (!bodyImage || !clothingImage) {
      return new Response(
        JSON.stringify({ error: 'Both body image and clothing image are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting virtual try-on process...');
    console.log('Clothing item:', clothingName);

    // Use Lovable AI Gateway with image editing model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a professional fashion stylist and image editor. Your task is to create a realistic virtual try-on image.

Take the person from the first image and dress them in the clothing item from the second image (${clothingName || 'clothing item'}). 

Instructions:
1. Keep the person's face, body pose, and proportions exactly as they are
2. Replace or overlay the appropriate clothing with the item from the second image
3. Make sure the clothing fits naturally on the body
4. Maintain realistic lighting, shadows, and fabric draping
5. The result should look like a real photograph of the person wearing the clothing
6. Keep the background similar to the original photo

Create a photorealistic result that looks natural and professionally styled.`
              },
              {
                type: "image_url",
                image_url: {
                  url: bodyImage // Base64 or URL of body image
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: clothingImage // Base64 or URL of clothing image
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Hết hạn mức sử dụng AI, vui lòng nạp thêm credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the generated image from the response
    const message = data.choices?.[0]?.message;
    const generatedImage = message?.images?.[0]?.image_url?.url;
    const textResponse = message?.content;

    if (!generatedImage) {
      console.error('No image generated in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'Không thể tạo hình ảnh thử đồ. Vui lòng thử lại.',
          textResponse 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Virtual try-on completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        generatedImage,
        message: textResponse || 'Đã tạo hình ảnh thử đồ thành công!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
