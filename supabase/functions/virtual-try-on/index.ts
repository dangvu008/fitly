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

    // Detect outfit mode: single item named '__FULL_OUTFIT__'
    const isOutfitMode = items.length === 1 && items[0].name === '__FULL_OUTFIT__';

    let contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }>;

    if (isOutfitMode) {
      console.log('OUTFIT MODE: Transferring entire outfit from reference image');

      const outfitPrompt = `FULL OUTFIT TRANSFER — IDENTITY LOCK MODE

YOU ARE GIVEN:
1. A TARGET PERSON photo (identity source)
2. A REFERENCE OUTFIT photo (clothing source)

YOUR TASK: Put the TARGET PERSON in the EXACT SAME OUTFIT as the reference while preserving the TARGET identity 100%.

SOURCE-OF-TRUTH PRIORITY (MANDATORY):
- Identity regions MUST come only from TARGET PERSON photo:
  face, hair, ears, neck, skin tone, arms, hands, body proportions, pose.
- Outfit regions MUST come only from REFERENCE OUTFIT photo:
  top, bottom, shoes, outerwear, accessories, colors, patterns, logos, textures.

ABSOLUTE FORBIDDEN ACTIONS:
- Never copy or blend face/head/skin/arms/hands from reference person.
- Never transfer reference person's body shape, skin tone, or limb geometry.
- Never alter target background.

OUTFIT TRANSFER RULES:
1. Extract ALL visible garments and accessories from reference.
2. Apply garments to correct anatomy on target person (shoes on feet, accessories on proper body parts).
3. Preserve exact color, print, logo, material finish and scale.
4. Keep physically correct layering, draping, wrinkles, shadows, and occlusion.
5. If reference outfit exposes skin, keep TARGET person's original skin identity in exposed areas.

OUTPUT: One photorealistic image of TARGET PERSON wearing the full reference outfit with strict identity preservation.`;

      contentArray = [
        { type: "text", text: outfitPrompt },
        { type: "text", text: "=== TARGET PERSON (keep this person's face and body) ===" },
        { type: "image_url", image_url: { url: bodyImage } },
        { type: "text", text: "=== REFERENCE OUTFIT (extract ALL clothing from this image and apply to target person) ===" },
        { type: "image_url", image_url: { url: items[0].imageUrl } },
      ];
    } else {
      // Individual items mode (existing logic)
      const clothingNames = items.map(i => i.name).join(', ');
      const clothingList = items.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n');

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

      contentArray = [
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
    }

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
        let finalImage = generatedImage;

        // Identity-lock verification for ALL modes (outfit + individual items)
        const runIdentityVerification = async (
          candidateImage: string,
          phase: 'initial' | 'refined'
        ): Promise<boolean> => {
          console.log(`Running identity verification check (${phase})...`);

          const verifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Compare IMAGE A (original person) and IMAGE B (try-on result).

CRITICAL GOAL: IMAGE B must be the SAME PERSON as IMAGE A.
If B looks like a different person (for example copied from clothing/model reference), return MISMATCH.

Check strictly:
1) Face identity (eyes, nose, lips, jawline, facial proportions)
2) Skin tone consistency (face/neck/arms/hands)
3) Head-neck-shoulder geometry and natural seam alignment
4) Body proportions, pose, camera angle, framing
5) Background structure and perspective

If ANY check fails or is uncertain => MISMATCH.
Answer EXACTLY one word:
- MATCH
- MISMATCH`,
                    },
                    { type: "text", text: "IMAGE A (original person):" },
                    { type: "image_url", image_url: { url: bodyImage } },
                    { type: "text", text: "IMAGE B (try-on result):" },
                    { type: "image_url", image_url: { url: candidateImage } },
                  ],
                },
              ],
            }),
          });

          if (!verifyResponse.ok) {
            console.error(`Identity check failed (${phase}) with status`, verifyResponse.status);
            return false;
          }

          try {
            const verifyData = await verifyResponse.json();
            const rawVerdict = verifyData.choices?.[0]?.message?.content || '';
            const verdict = rawVerdict.trim().toUpperCase().replace(/[^A-Z]/g, '');
            console.log(`Identity verification verdict (${phase}):`, verdict || 'EMPTY');
            return verdict === 'MATCH';
          } catch {
            console.error(`Failed to parse identity check response (${phase})`);
            return false;
          }
        };

        const initialMatch = await runIdentityVerification(finalImage, 'initial');

        if (!initialMatch) {
          console.log('Identity mismatch detected — starting refinement pass...');

          const identityRefinementPrompt = `IDENTITY LOCK REFINEMENT (STRICT)

MODE: ${isOutfitMode ? 'FULL OUTFIT' : 'INDIVIDUAL ITEMS'}
INPUT A: Draft try-on result image (use this as OUTFIT/APPLIED GARMENT source)
INPUT B: Original target person image (ABSOLUTE identity/pose/background source)

TASK:
- Extract ONLY garment details from INPUT A: item type, color, pattern, logo, material, layering.
- Re-apply those garments onto INPUT B.
- Preserve INPUT B exactly for: face, hairline, ears, neck skin, arms, hands,
  body proportions, pose, camera framing, and background.

STRICT RULES:
- Never copy person identity from INPUT A.
- Never copy body geometry, pose, or background from INPUT A.
- If there is any head/neck seam mismatch, correct it to natural anatomy.
- Keep clothing details photorealistic and faithful to references.

OUTPUT: One corrected photorealistic image where person identity is from INPUT B and outfit is preserved from INPUT A.`;

          const refinementContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            { type: "text", text: identityRefinementPrompt },
            { type: "text", text: "=== INPUT A: DRAFT TRY-ON RESULT (extract applied outfit from here) ===" },
            { type: "image_url", image_url: { url: generatedImage } },
            { type: "text", text: "=== INPUT B: ORIGINAL TARGET PERSON (identity source) ===" },
            { type: "image_url", image_url: { url: bodyImage } },
            { type: "text", text: "=== CLOTHING REFERENCES (preserve these garments accurately) ===" },
          ];

          items.forEach((item, idx) => {
            refinementContent.push({ type: "text", text: `REFERENCE ITEM ${idx + 1}: ${item.name}` });
            refinementContent.push({ type: "image_url", image_url: { url: item.imageUrl } });
          });

          const refinementAttempts: Array<{ model: string }> = [
            { model: "google/gemini-3.1-flash-image-preview" },
            { model: "google/gemini-3-pro-image-preview" },
          ];

          let refinementSucceeded = false;

          for (const refinementAttempt of refinementAttempts) {
            console.log(`Identity refinement with model: ${refinementAttempt.model}`);

            const refinementResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: refinementAttempt.model,
                messages: [{ role: "user", content: refinementContent }],
                modalities: ["image", "text"],
              }),
            });

            if (!refinementResponse.ok) {
              console.error(`Identity refinement failed with status ${refinementResponse.status}`);
              continue;
            }

            const refinementText = await refinementResponse.text();
            if (!refinementText || refinementText.trim() === '') continue;

            try {
              const refinementData = JSON.parse(refinementText);
              const refinedImage = refinementData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (refinedImage) {
                finalImage = refinedImage;
                refinementSucceeded = true;
                break;
              }
            } catch {
              console.error('Failed to parse identity refinement response');
            }
          }

          if (!refinementSucceeded) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Không thể giữ đúng khuôn mặt gốc. Vui lòng thử lại với ảnh rõ mặt hơn.',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const refinedMatch = await runIdentityVerification(finalImage, 'refined');
          if (!refinedMatch) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Kết quả chưa giữ đúng khuôn mặt gốc. Vui lòng thử lại với ảnh đứng thẳng, rõ mặt và đủ sáng.',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Identity-lock refinement completed successfully');
        } else {
          console.log('Identity verified OK — skipping refinement pass');
        }

        console.log('Virtual try-on completed successfully');
        return new Response(
          JSON.stringify({
            success: true,
            generatedImage: finalImage,
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
          candidateImage: string,
          phase: 'initial' | 'refined'
        ): Promise<boolean> => {
          console.log(`Running identity verification check (${phase})...`);

          const verifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Compare IMAGE A (original person) and IMAGE B (try-on result).

CRITICAL GOAL: IMAGE B must be the SAME PERSON as IMAGE A.
If B looks like a different person (for example copied from clothing/model reference), return MISMATCH.

Check strictly:
1) Face identity (eyes, nose, lips, jawline, facial proportions)
2) Skin tone consistency (face/neck/arms/hands)
3) Head-neck-shoulder geometry and natural seam alignment
4) Body proportions, pose, camera angle, framing
5) Background structure and perspective

If ANY check fails or is uncertain => MISMATCH.
Answer EXACTLY one word:
- MATCH
- MISMATCH`,
                    },
                    { type: "text", text: "IMAGE A (original person):" },
                    { type: "image_url", image_url: { url: bodyImage } },
                    { type: "text", text: "IMAGE B (try-on result):" },
                    { type: "image_url", image_url: { url: candidateImage } },
                  ],
                },
              ],
            }),
          });

          if (!verifyResponse.ok) {
            console.error(`Identity check failed (${phase}) with status`, verifyResponse.status);
            return false;
          }

          try {
            const verifyData = await verifyResponse.json();
            const rawVerdict = verifyData.choices?.[0]?.message?.content || '';
            const verdict = rawVerdict.trim().toUpperCase().replace(/[^A-Z]/g, '');
            console.log(`Identity verification verdict (${phase}):`, verdict || 'EMPTY');
            return verdict === 'MATCH';
          } catch {
            console.error(`Failed to parse identity check response (${phase})`);
            return false;
          }
        };

        const initialMatch = await runIdentityVerification(finalImage, 'initial');

        if (!initialMatch) {
          console.log('Identity mismatch detected — starting refinement pass...');

          const identityRefinementPrompt = `IDENTITY LOCK REFINEMENT (STRICT)

MODE: ${isOutfitMode ? 'FULL OUTFIT' : 'INDIVIDUAL ITEMS'}
INPUT A: Draft try-on result image (use this as OUTFIT/APPLIED GARMENT source)
INPUT B: Original target person image (ABSOLUTE identity/pose/background source)

TASK:
- Extract ONLY garment details from INPUT A: item type, color, pattern, logo, material, layering.
- Re-apply those garments onto INPUT B.
- Preserve INPUT B exactly for: face, hairline, ears, neck skin, arms, hands,
  body proportions, pose, camera framing, and background.

STRICT RULES:
- Never copy person identity from INPUT A.
- Never copy body geometry, pose, or background from INPUT A.
- If there is any head/neck seam mismatch, correct it to natural anatomy.
- Keep clothing details photorealistic and faithful to references.

OUTPUT: One corrected photorealistic image where person identity is from INPUT B and outfit is preserved from INPUT A.`;

          const refinementContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            { type: "text", text: identityRefinementPrompt },
            { type: "text", text: "=== INPUT A: DRAFT TRY-ON RESULT (extract applied outfit from here) ===" },
            { type: "image_url", image_url: { url: generatedImage } },
            { type: "text", text: "=== INPUT B: ORIGINAL TARGET PERSON (identity source) ===" },
            { type: "image_url", image_url: { url: bodyImage } },
            { type: "text", text: "=== CLOTHING REFERENCES (preserve these garments accurately) ===" },
          ];

          items.forEach((item, idx) => {
            refinementContent.push({ type: "text", text: `REFERENCE ITEM ${idx + 1}: ${item.name}` });
            refinementContent.push({ type: "image_url", image_url: { url: item.imageUrl } });
          });

          const refinementAttempts: Array<{ model: string }> = [
            { model: "google/gemini-3.1-flash-image-preview" },
            { model: "google/gemini-3-pro-image-preview" },
          ];

          let refinementSucceeded = false;

          for (const refinementAttempt of refinementAttempts) {
            console.log(`Identity refinement with model: ${refinementAttempt.model}`);

            const refinementResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: refinementAttempt.model,
                messages: [{ role: "user", content: refinementContent }],
                modalities: ["image", "text"],
              }),
            });

            if (!refinementResponse.ok) {
              console.error(`Identity refinement failed with status ${refinementResponse.status}`);
              continue;
            }

            const refinementText = await refinementResponse.text();
            if (!refinementText || refinementText.trim() === '') continue;

            try {
              const refinementData = JSON.parse(refinementText);
              const refinedImage = refinementData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (refinedImage) {
                finalImage = refinedImage;
                refinementSucceeded = true;
                break;
              }
            } catch {
              console.error('Failed to parse identity refinement response');
            }
          }

          if (!refinementSucceeded) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Không thể giữ đúng khuôn mặt gốc. Vui lòng thử lại với ảnh rõ mặt hơn.',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const refinedMatch = await runIdentityVerification(finalImage, 'refined');
          if (!refinedMatch) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Kết quả chưa giữ đúng khuôn mặt gốc. Vui lòng thử lại với ảnh đứng thẳng, rõ mặt và đủ sáng.',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Identity-lock refinement completed successfully');
        } else {
          console.log('Identity verified OK — skipping refinement pass');
        }

        console.log('Virtual try-on completed successfully');
        return new Response(
          JSON.stringify({
            success: true,
            generatedImage: finalImage,
            message: 'Try-on image generated successfully!',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
          candidateImage: string,
          phase: 'initial' | 'refined'
        ): Promise<boolean> => {
          console.log(`Running identity verification check (${phase})...`);

          const verifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Compare IMAGE A (original person) and IMAGE B (try-on result).

CRITICAL GOAL: IMAGE B must be the SAME PERSON as IMAGE A.
If B looks like a different person (for example copied from clothing/model reference), return MISMATCH.

Check strictly:
1) Face identity (eyes, nose, lips, jawline, facial proportions)
2) Skin tone consistency (face/neck/arms/hands)
3) Head-neck-shoulder geometry and natural seam alignment
4) Body proportions, pose, camera angle, framing
5) Background structure and perspective

If ANY check fails or is uncertain => MISMATCH.
Answer EXACTLY one word:
- MATCH
- MISMATCH`,
                    },
                    { type: "text", text: "IMAGE A (original person):" },
                    { type: "image_url", image_url: { url: bodyImage } },
                    { type: "text", text: "IMAGE B (try-on result):" },
                    { type: "image_url", image_url: { url: candidateImage } },
                  ],
                },
              ],
            }),
          });

          if (!verifyResponse.ok) {
            console.error(`Identity check failed (${phase}) with status`, verifyResponse.status);
            return false;
          }

          try {
            const verifyData = await verifyResponse.json();
            const rawVerdict = verifyData.choices?.[0]?.message?.content || '';
            const verdict = rawVerdict.trim().toUpperCase().replace(/[^A-Z]/g, '');
            console.log(`Identity verification verdict (${phase}):`, verdict || 'EMPTY');
            return verdict === 'MATCH';
          } catch {
            console.error(`Failed to parse identity check response (${phase})`);
            return false;
          }
        };

        const initialMatch = await runIdentityVerification(finalImage, 'initial');

        if (!initialMatch) {
          console.log('Identity mismatch detected — starting refinement pass...');

          const identityRefinementPrompt = `IDENTITY LOCK REFINEMENT (STRICT)

MODE: ${isOutfitMode ? 'FULL OUTFIT' : 'INDIVIDUAL ITEMS'}
INPUT A: Draft try-on result image (use this as OUTFIT/APPLIED GARMENT source)
INPUT B: Original target person image (ABSOLUTE identity/pose/background source)

TASK:
- Extract ONLY garment details from INPUT A: item type, color, pattern, logo, material, layering.
- Re-apply those garments onto INPUT B.
- Preserve INPUT B exactly for: face, hairline, ears, neck skin, arms, hands,
  body proportions, pose, camera framing, and background.

STRICT RULES:
- Never copy person identity from INPUT A.
- Never copy body geometry, pose, or background from INPUT A.
- If there is any head/neck seam mismatch, correct it to natural anatomy.
- Keep clothing details photorealistic and faithful to references.

OUTPUT: One corrected photorealistic image where person identity is from INPUT B and outfit is preserved from INPUT A.`;

          const refinementContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            { type: "text", text: identityRefinementPrompt },
            { type: "text", text: "=== INPUT A: DRAFT TRY-ON RESULT (extract applied outfit from here) ===" },
            { type: "image_url", image_url: { url: generatedImage } },
            { type: "text", text: "=== INPUT B: ORIGINAL TARGET PERSON (identity source) ===" },
            { type: "image_url", image_url: { url: bodyImage } },
            { type: "text", text: "=== CLOTHING REFERENCES (preserve these garments accurately) ===" },
          ];

          items.forEach((item, idx) => {
            refinementContent.push({ type: "text", text: `REFERENCE ITEM ${idx + 1}: ${item.name}` });
            refinementContent.push({ type: "image_url", image_url: { url: item.imageUrl } });
          });

          const refinementAttempts: Array<{ model: string }> = [
            { model: "google/gemini-3.1-flash-image-preview" },
            { model: "google/gemini-3-pro-image-preview" },
          ];

          let refinementSucceeded = false;

          for (const refinementAttempt of refinementAttempts) {
            console.log(`Identity refinement with model: ${refinementAttempt.model}`);

            const refinementResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: refinementAttempt.model,
                messages: [{ role: "user", content: refinementContent }],
                modalities: ["image", "text"],
              }),
            });

            if (!refinementResponse.ok) {
              console.error(`Identity refinement failed with status ${refinementResponse.status}`);
              continue;
            }

            const refinementText = await refinementResponse.text();
            if (!refinementText || refinementText.trim() === '') continue;

            try {
              const refinementData = JSON.parse(refinementText);
              const refinedImage = refinementData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (refinedImage) {
                finalImage = refinedImage;
                refinementSucceeded = true;
                break;
              }
            } catch {
              console.error('Failed to parse identity refinement response');
            }
          }

          if (!refinementSucceeded) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Không thể giữ đúng khuôn mặt gốc. Vui lòng thử lại với ảnh rõ mặt hơn.',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const refinedMatch = await runIdentityVerification(finalImage, 'refined');
          if (!refinedMatch) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Kết quả chưa giữ đúng khuôn mặt gốc. Vui lòng thử lại với ảnh đứng thẳng, rõ mặt và đủ sáng.',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Identity-lock refinement completed successfully');
        } else {
          console.log('Identity verified OK — skipping refinement pass');
        }
          console.log('Running identity verification check...');

          const verifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: `Compare IMAGE A (original person) and IMAGE B (try-on result).
Focus on STRICT preservation from A to B:
1) Face identity (eyes, nose, lips, jawline)
2) Skin tone consistency (face/neck/arms/hands)
3) Arm/hand identity and proportions
4) Head-neck-shoulder alignment naturalness
5) Same pose, camera angle, body silhouette and framing
6) Same background structure and perspective

If ANY item is different or uncertain, answer MISMATCH.
Answer EXACTLY one word:
- MATCH = all items are clearly preserved from A
- MISMATCH = any item is changed/not preserved` },
                    { type: "text", text: "IMAGE A (original person):" },
                    { type: "image_url", image_url: { url: bodyImage } },
                    { type: "text", text: "IMAGE B (try-on result):" },
                    { type: "image_url", image_url: { url: generatedImage } },
                  ],
                },
              ],
            }),
          });

          // Safe default: refine unless verifier is confidently MATCH
          let needsRefinement = true;

          if (verifyResponse.ok) {
            try {
              const verifyData = await verifyResponse.json();
              const rawVerdict = verifyData.choices?.[0]?.message?.content || '';
              const verdict = rawVerdict.trim().toUpperCase().replace(/[^A-Z]/g, '');
              console.log('Identity verification verdict:', verdict || 'EMPTY');
              needsRefinement = verdict !== 'MATCH';
            } catch {
              console.error('Failed to parse identity check response, will run refinement');
              needsRefinement = true;
            }
          } else {
            console.error('Identity check failed with status', verifyResponse.status, '— will run refinement');
            needsRefinement = true;
          }

          // Step 2: Only run heavy refinement if identity mismatch detected
          if (needsRefinement) {
            console.log('Identity mismatch detected — starting refinement pass...');

            const identityRefinementPrompt = `IDENTITY LOCK REFINEMENT (STRICT)

INPUT A: Draft try-on result image (contains outfit placement)
INPUT B: Original target person image (identity source)

TASK:
- Extract ONLY outfit details from INPUT A (garment type, color, pattern, logo, material).
- Re-apply that outfit onto INPUT B while preserving INPUT B as source of truth.
- Preserve from INPUT B with exact fidelity:
  face, hairline, ears, neck skin, arms, hands, full body proportions,
  head-neck-shoulder geometry/alignment, pose, camera framing, and background.
- Remove any mismatch seam between head and torso so result looks anatomically natural.

STRICT RULES:
- Never copy the whole person from INPUT A.
- Never copy pose, body geometry, or background from INPUT A.
- Do NOT alter outfit design/color/pattern/logo while re-applying to INPUT B.

OUTPUT: One photorealistic corrected image where person/pose/background are from INPUT B and outfit is from INPUT A.`;

            const refinementContent = [
              { type: "text", text: identityRefinementPrompt },
              { type: "text", text: "=== INPUT A: DRAFT TRY-ON RESULT (extract outfit details only) ===" },
              { type: "image_url", image_url: { url: generatedImage } },
              { type: "text", text: "=== INPUT B: ORIGINAL TARGET PERSON (preserve person/pose/background exactly) ===" },
              { type: "image_url", image_url: { url: bodyImage } },
            ];

            const refinementAttempts: Array<{ model: string }> = [
              { model: "google/gemini-3.1-flash-image-preview" },
              { model: "google/gemini-3-pro-image-preview" },
            ];

            for (const refinementAttempt of refinementAttempts) {
              console.log(`Identity refinement with model: ${refinementAttempt.model}`);

              const refinementResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: refinementAttempt.model,
                  messages: [{ role: "user", content: refinementContent }],
                  modalities: ["image", "text"],
                }),
              });

              if (!refinementResponse.ok) {
                console.error(`Identity refinement failed with status ${refinementResponse.status}`);
                continue;
              }

              const refinementText = await refinementResponse.text();
              if (!refinementText || refinementText.trim() === '') continue;

              try {
                const refinementData = JSON.parse(refinementText);
                const refinedImage = refinementData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
                if (refinedImage) {
                  finalImage = refinedImage;
                  console.log('Identity-lock refinement completed successfully');
                  break;
                }
              } catch {
                console.error('Failed to parse identity refinement response');
              }
            }
          } else {
            console.log('Identity verified OK — skipping refinement pass');
          }
        }

        console.log('Virtual try-on completed successfully');
        return new Response(
          JSON.stringify({
            success: true,
            generatedImage: finalImage,
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
