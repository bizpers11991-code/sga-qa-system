// services/imageUtils.ts

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const JPEG_QUALITY = 0.85; // 85% quality

/**
 * Resizes and compresses an image file on the client-side.
 * @param file The original image file from an input element.
 * @returns A Promise that resolves with the base64 data URL of the optimized image.
 */
export const optimizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Could not read file."));
      }

      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return reject(new Error("Could not get canvas context."));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Get the data URL for the compressed image
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fetches an image from a URL and converts it to a base64 data URL.
 * @param url The URL of the image to fetch.
 * @returns A Promise that resolves with the base64 data URL.
 */
export const imageUrlToDataUrl = async (url: string): Promise<string> => {
    // Add a cache-busting parameter to ensure the latest image is fetched, bypassing browser cache if necessary.
    const response = await fetch(`${url}?t=${new Date().getTime()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
