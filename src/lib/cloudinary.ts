'use client';

/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset.
 * This bypasses the need for server-side API keys and avoids CORS proxy issues.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'primefunded_uploads');
  formData.append('cloud_name', 'dkws10vkj');

  try {
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dkws10vkj/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Upload failed. Ensure the upload preset is set to Unsigned in Cloudinary settings.');
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error: any) {
    console.error('[Cloudinary-Direct] Upload failure:', error);
    throw new Error(error.message || "Connection failed: Could not reach Cloudinary servers.");
  }
};
