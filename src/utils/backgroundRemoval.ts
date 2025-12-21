import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

let segmenter: any = null;

function resizeImageIfNeeded(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  image: HTMLImageElement
): boolean {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const initBackgroundRemover = async (onProgress?: (progress: number) => void): Promise<void> => {
  if (segmenter) return;
  
  onProgress?.(10);
  
  try {
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device: 'webgpu' }
    );
    onProgress?.(100);
  } catch (error) {
    console.warn('WebGPU not available, falling back to CPU');
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512'
    );
    onProgress?.(100);
  }
};

export const removeBackground = async (
  imageDataUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    onProgress?.(5);
    
    // Initialize if needed
    if (!segmenter) {
      await initBackgroundRemover((p) => onProgress?.(5 + p * 0.4));
    }
    
    onProgress?.(50);
    
    // Load image
    const img = await loadImage(imageDataUrl);
    
    // Convert to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    resizeImageIfNeeded(canvas, ctx, img);
    
    onProgress?.(60);
    
    // Get image data as base64 for processing
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Process with segmentation model
    const result = await segmenter(imageData);
    
    onProgress?.(80);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply mask
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;
    
    // Invert mask to keep subject
    for (let i = 0; i < result[0].mask.data.length; i++) {
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.(100);
    
    return outputCanvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Check if image has transparency (already has background removed)
export const hasTransparentBackground = async (imageDataUrl: string): Promise<boolean> => {
  try {
    const img = await loadImage(imageDataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check corners and edges for transparency
    const checkPoints = [
      0, // top-left
      (canvas.width - 1) * 4, // top-right
      (canvas.height - 1) * canvas.width * 4, // bottom-left
      ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4, // bottom-right
    ];
    
    let transparentCount = 0;
    for (const point of checkPoints) {
      if (data[point + 3] < 200) { // Alpha channel
        transparentCount++;
      }
    }
    
    return transparentCount >= 2;
  } catch {
    return false;
  }
};
