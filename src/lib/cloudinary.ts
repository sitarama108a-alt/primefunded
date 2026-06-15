'use client';

/**
 * Uploads a file to Cloudinary using XMLHttpRequest to bypass common CORS issues 
 * in development environments.
 * 
 * @param file - The file to upload (Image/PDF)
 * @returns Promise<string> - The secure URL of the uploaded asset
 */
export const uploadToCloudinary = (
  file: File
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "primefunded_uploads");

    const xhr = new XMLHttpRequest();
    
    xhr.open(
      "POST",
      "https://api.cloudinary.com/v1_1/dkws10vkj/image/upload",
      true
    );
    
    xhr.onload = () => {
      try {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || "Upload failed"));
        }
      } catch (e) {
        reject(new Error("Failed to parse Cloudinary response"));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error("Network error - check internet connection and CORS settings"));
    };
    
    xhr.send(formData);
  });
};
