import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Same limits as the site (client/src/features/nutrition/compressMealPhoto.ts).
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

export type PickedPhoto = { uri: string; width: number; height: number };

function base64Bytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

async function renderJpeg(photo: PickedPhoto, quality: number): Promise<string> {
  const longest = Math.max(photo.width, photo.height);
  const context = ImageManipulator.manipulate(photo.uri);
  if (longest > MAX_EDGE) {
    context.resize(photo.width >= photo.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG, base64: true });
  if (!result.base64) throw new MealPhotoError('FOOD_SCAN_BAD_TYPE');
  return result.base64;
}

/** Longest edge ≤ 1024 px, JPEG, ≤ ~520 KB, as base64 for POST /api/nutrition/scan or /api/finance/scan. */
export async function compressMealPhoto(photo: PickedPhoto): Promise<{ image: string; mimeType: 'image/jpeg' }> {
  let base64: string;
  try {
    base64 = await renderJpeg(photo, 0.72);
    if (base64Bytes(base64) > MAX_BYTES) base64 = await renderJpeg(photo, 0.5);
  } catch (error) {
    if (error instanceof MealPhotoError) throw error;
    throw new MealPhotoError('FOOD_SCAN_BAD_TYPE');
  }
  if (base64Bytes(base64) > MAX_BYTES) throw new MealPhotoError('FOOD_SCAN_TOO_LARGE');
  return { image: base64, mimeType: 'image/jpeg' };
}
