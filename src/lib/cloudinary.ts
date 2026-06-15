'use client';

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * 
 * IMPORTANT: You must enable "Unsigned" mode for your upload preset 
 * in the Cloudinary Dashboard (Settings -> Upload -> Upload presets).
 * Also, ensure your "Allowed Origins" include your application URL or '*' for development.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkws10vkj";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "primefunded_uploads";

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        // Using 'cors' mode explicitly though it is the default for cross-origin fetches
        mode: 'cors'
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Cloudinary Upload Failed");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    
    // Check if the error is a TypeError which often indicates a CORS or Network issue
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error("Upload Failed: Network error or CORS block. Please verify Cloudinary Dashboard 'Allowed Origins' settings.");
    }
    
    throw error;
  }
};
