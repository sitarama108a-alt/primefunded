'use client';

/**
 * Proxies file uploads through our local Next.js API route to bypass CORS 
 * restrictions when communicating with Cloudinary from the browser.
 * 
 * Returns the secure URL of the uploaded asset.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Call our local server-side API route instead of direct Cloudinary fetch
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'The server-side upload proxy failed. Check API logs.');
    }

    const data = await response.json();
    return data.url;

  } catch (error: any) {
    console.error('[Cloudinary-Proxy] Client-side trigger failure:', error);
    
    // Provide user-friendly feedback for network vs application errors
    if (error instanceof TypeError) {
      throw new Error("Connection failed: Could not reach the local upload server.");
    }
    
    throw error;
  }
};
