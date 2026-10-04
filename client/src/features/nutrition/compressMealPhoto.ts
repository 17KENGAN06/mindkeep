const MAX_EDGE = 1024;
const MAX_BYTES = 520_000;

export class MealPhotoError extends Error {
  readonly code: 'FOOD_SCAN_BAD_TYPE' | 'FOOD_SCAN_TOO_LARGE';

  constructor(code: 'FOOD_SCAN_BAD_TYPE' | 'FOOD_SCAN_TOO_LARGE') {
    super(code);
    this.name = 'MealPhotoError';
    this.code = code;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.onerror = () => reject(new MealPhotoError('FOOD_SCAN_BAD_TYPE'));
    reader.readAsDataURL(blob);
  });
}

async function canvasToJpeg(bitmap: ImageBitmap, quality: number): Promise<Blob> {
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new MealPhotoError('FOOD_SCAN_BAD_TYPE');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
  if (!blob) throw new MealPhotoError('FOOD_SCAN_BAD_TYPE');
  return blob;
}

export async function compressMealPhoto(file: File): Promise<{ image: string; mimeType: 'image/jpeg' }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new MealPhotoError('FOOD_SCAN_BAD_TYPE');
  }

  try {
    let blob = await canvasToJpeg(bitmap, 0.72);
    if (blob.size > MAX_BYTES) {
      blob = await canvasToJpeg(bitmap, 0.5);
    }
    if (blob.size > MAX_BYTES) {
      throw new MealPhotoError('FOOD_SCAN_TOO_LARGE');
    }
    return { image: await blobToBase64(blob), mimeType: 'image/jpeg' };
  } finally {
    bitmap.close();
  }
}
