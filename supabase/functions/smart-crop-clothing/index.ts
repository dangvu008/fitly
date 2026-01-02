import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse } from '../_shared/cors.ts';

interface SmartCropRequest {
  imageBase64: string;
  removeBackground?: boolean;
}

interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedItem {
  type: string;
  confidence: number;
  bounds: CropBounds;
}

interface SmartCropResponse {
  success: boolean;
  croppedImage?: string;
  backgroundRemovedImage?: string;
  cropBounds?: CropBounds;
  detectedItems?: DetectedItem[];
  error?: string;
}

/**
 * Remove background from image using Hugging Face Inference API
 * Uses the RMBG-1.4 model for high-quality background removal
 */
async function removeImageBackground(imageBase64: string): Promise<string | null> {
  const huggingFaceApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
  
  if (!huggingFaceApiKey) {
    console.warn('[smart-crop-clothing] HUGGINGFACE_API_KEY not set, skipping background removal');
    return null;
  }

  try {
    console.log('[smart-crop-clothing] Calling Hugging Face RMBG API...');
    
    // Convert base64 to blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: 'image/png' });
    
    // Call Hugging Face Inference API with RMBG-1.4 model
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceApiKey}`,
        },
        body: imageBlob,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error(`[smart-crop-clothing] HF API error: ${hfResponse.status} - ${errorText}`);
      
      if (hfResponse.status === 503) {
        console.warn('[smart-crop-clothing] Model is loading, skipping background removal');
      }
      return null;
    }

    // Get the result as blob and convert to base64
    const resultBlob = await hfResponse.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const mimeType = resultBlob.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    console.log('[smart-crop-clothing] Background removal successful');
    return dataUrl;
    
  } catch (error) {
    console.error('[smart-crop-clothing] Background removal error:', error);
    return null;
  }
}

/**
 * Use AI to detect clothing items in the image and return crop bounds
 * Uses Lovable AI Gateway with vision model
 */
async function detectClothingWithAI(imageBase64: string): Promise<{
  detectedItems: DetectedItem[];
  bestItem: DetectedItem | null;
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const prompt = `Analyze this image (likely a screenshot from a shopping app or website) and detect clothing items.

Your task:
1. Identify all clothing items visible in the image
2. For each item, estimate its bounding box as percentages of the image dimensions (0-100)
3. Filter out UI elements like status bars, navigation bars, buttons, text overlays, price tags
4. Focus on the actual clothing/product images

Return a JSON response with this structure:
{
  "items": [
    {
      "type": "top" | "bottom" | "dress" | "shoes" | "accessory" | "outerwear",
      "description": "brief description of the item",
      "confidence": 0.0-1.0,
      "bounds": {
        "x": number (0-100, percentage from left),
        "y": number (0-100, percentage from top),
        "width": number (0-100, percentage of image width),
        "height": number (0-100, percentage of image height)
      }
    }
  ],
  "hasUIElements": boolean,
  "isScreenshot": boolean,
  "mainClothingIndex": number (index of the most prominent clothing item, -1 if none)
}

Rules:
- Bounds should tightly wrap the clothing item, excluding background
- If multiple items, identify the largest/most prominent one
- Confidence should reflect how certain you are this is a clothing item
- Filter out: status bars, navigation, buttons, text, watermarks, logos
- Include: actual product images, clothing items

Only respond with the JSON object, nothing else.`;

  try {
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
      const errorText = await response.text();
      console.error('[smart-crop-clothing] AI detection error:', response.status, errorText);
      throw new Error(`AI detection failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[smart-crop-clothing] No JSON in AI response:', content);
      return { detectedItems: [], bestItem: null };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const detectedItems: DetectedItem[] = (parsed.items || []).map((item: any) => ({
      type: item.type || 'unknown',
      confidence: item.confidence || 0.5,
      bounds: {
        x: Math.max(0, Math.min(100, item.bounds?.x || 0)),
        y: Math.max(0, Math.min(100, item.bounds?.y || 0)),
        width: Math.max(0, Math.min(100, item.bounds?.width || 100)),
        height: Math.max(0, Math.min(100, item.bounds?.height || 100)),
      }
    }));

    // Find the best item (largest area with highest confidence)
    let bestItem: DetectedItem | null = null;
    let bestScore = 0;

    for (const item of detectedItems) {
      const area = item.bounds.width * item.bounds.height;
      const score = area * item.confidence;
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    // If mainClothingIndex is specified and valid, use that instead
    if (parsed.mainClothingIndex >= 0 && parsed.mainClothingIndex < detectedItems.length) {
      bestItem = detectedItems[parsed.mainClothingIndex];
    }

    console.log(`[smart-crop-clothing] Detected ${detectedItems.length} items, best: ${bestItem?.type || 'none'}`);
    
    return { detectedItems, bestItem };
    
  } catch (error) {
    console.error('[smart-crop-clothing] Detection error:', error);
    return { detectedItems: [], bestItem: null };
  }
}

/**
 * Crop image based on bounds (percentage-based)
 * Returns base64 cropped image
 */
async function cropImage(imageBase64: string, bounds: CropBounds): Promise<string> {
  // For server-side cropping, we'll use the bounds to create a new canvas
  // Since Deno doesn't have native canvas, we'll return the original with bounds
  // The client can use these bounds to crop, or we can use an external service
  
  // For now, return the original image with bounds metadata
  // In production, you might want to use a service like Cloudinary or imgproxy
  console.log(`[smart-crop-clothing] Crop bounds: x=${bounds.x}%, y=${bounds.y}%, w=${bounds.width}%, h=${bounds.height}%`);
  
  return imageBase64;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    const { imageBase64, removeBackground: shouldRemoveBackground }: SmartCropRequest = await req.json();

    if (!imageBase64) {
      return corsJsonResponse(req, { 
        success: false, 
        error: 'imageBase64 is required' 
      }, 400);
    }

    // Validate base64 format
    if (!imageBase64.startsWith('data:image/')) {
      return corsJsonResponse(req, { 
        success: false, 
        error: 'Invalid image format. Expected base64 data URL.' 
      }, 400);
    }

    console.log('[smart-crop-clothing] Processing image...');

    // Step 1: Detect clothing items using AI
    const { detectedItems, bestItem } = await detectClothingWithAI(imageBase64);

    if (!bestItem) {
      return corsJsonResponse(req, {
        success: false,
        error: 'No clothing items detected in the image',
        detectedItems,
      });
    }

    // Step 2: Crop the image based on detected bounds
    const croppedImage = await cropImage(imageBase64, bestItem.bounds);

    // Step 3: Optionally remove background
    let backgroundRemovedImage: string | undefined;
    if (shouldRemoveBackground) {
      console.log('[smart-crop-clothing] Attempting background removal...');
      const removedBgResult = await removeImageBackground(croppedImage);
      if (removedBgResult) {
        backgroundRemovedImage = removedBgResult;
      }
    }

    const response: SmartCropResponse = {
      success: true,
      croppedImage,
      backgroundRemovedImage,
      cropBounds: bestItem.bounds,
      detectedItems,
    };

    console.log('[smart-crop-clothing] Processing complete');
    return corsJsonResponse(req, response);

  } catch (error) {
    console.error('[smart-crop-clothing] Error:', error);
    return corsJsonResponse(req, { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});
