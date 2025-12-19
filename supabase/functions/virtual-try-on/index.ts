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

    // Use Lovable AI Gateway (try multiple prompt/model variants for robustness)
    const basePrompt = `Virtual try-on task.

IMPORTANT:
- IMAGE A is the person to dress (keep the same person, face, pose, body proportions, and background).
- IMAGE B is ONLY a clothing reference (${clothingName || 'clothing item'}). If IMAGE B contains a person/mannequin, IGNORE their body/face entirely.
- Transfer ONLY the clothing item from IMAGE B onto the person in IMAGE A.
- Make it photorealistic with natural fabric drape, wrinkles, and realistic shadows/light.

Return ONE final image.`;

    const attempts: Array<{ model: string; prompt: string }> = [
      {
        model: "google/gemini-3-pro-image-preview",
        prompt: basePrompt,
      },
      {
        // Fallback image model (often better for compositing/edit-like tasks)
        model: "google/gemini-2.5-flash-image",
        prompt: basePrompt + "\n\nBe extra strict: NEVER change the identity of the person in IMAGE A.",
      },
    ];

    let lastTextResponse: string | undefined;

    for (let i = 0; i < attempts.length; i++) {
      const { model, prompt } = attempts[i];
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
              content: [
                { type: "text", text: prompt },
                { type: "text", text: "IMAGE A (person to dress):" },
                { type: "image_url", image_url: { url: bodyImage } },
                { type: "text", text: "IMAGE B (clothing reference ONLY):" },
                { type: "image_url", image_url: { url: clothingImage } },
              ],
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
