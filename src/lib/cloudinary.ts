'use client';

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * 
 * IMPORTANT: Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and 
 * NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to be defined in .env
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 1. Configuration Check
  if (!cloudName || !uploadPreset) {
    console.error('[Cloudinary] Missing configuration:', { cloudName, uploadPreset });
    throw new Error('Cloudinary not configured. Please ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set in your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    // 2. Perform Upload
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        mode: 'cors'
      }
    );

    // 3. Handle Server Errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Cloudinary Upload Failed");
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error: any) {
    console.error("Cloudinary upload catch block:", error);
    
    // 4. Handle Network/CORS Errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error("Upload Failed: Network error or CORS block. Ensure 'Allowed Origins' in Cloudinary Settings (Upload Tab) is set to '*' or your current domain.");
    }
    
    throw error;
  }
};
