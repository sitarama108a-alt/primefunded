
'use client';

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Optimized for resilience against CORS and network errors in the preview environment.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 1. Configuration Validation
  if (!cloudName || !uploadPreset) {
    console.error('[Cloudinary] Missing configuration:', { cloudName, uploadPreset });
    throw new Error('Cloudinary not configured. Ensure cloud name and preset are set in .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);

  try {
    // 2. Execute Fetch
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
      const errorData = await response.json().catch(() => ({}));
      console.error('[Cloudinary] Upload Error Response:', errorData);
      throw new Error(errorData.error?.message || "Cloudinary Upload Failed");
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error: any) {
    console.error("[Cloudinary] Critical Upload Failure:", error);
    
    // 4. Handle Network/CORS Specifics
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error("Upload Blocked: Network error or CORS restriction. Ensure 'Allowed fetch domains' in Cloudinary Settings (Security Tab) include this workspace domain.");
    }
    
    throw error;
  }
};
