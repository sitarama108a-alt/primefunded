'use client';

/**
 * Utility to convert a file to a Base64 string for direct Firestore storage.
 * This bypasses CORS issues with external storage providers during preview/dev.
 */
export const uploadImageAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Basic validation
    const maxSize = 2 * 1024 * 1024; // 2MB limit to keep Firestore documents performant
    if (file.size > maxSize) {
      reject(new Error('File is too large. Max size is 2MB for database storage.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};
