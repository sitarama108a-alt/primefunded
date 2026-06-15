'use client';

/**
 * @fileOverview Cloudinary Unsigned Upload Utility
 * Handles media uploads to the Cloudinary CDN.
 */

const cloudName = "dkws10vkj";
const uploadPreset = "primefunded_uploads";

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("cloud_name", cloudName);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Cloudinary Upload Failed");
    }
    
    const data = await response.json();
    return data.secure_url;
    
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error);
    throw error;
  }
};
