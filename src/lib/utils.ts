import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Basic input sanitization to prevent XSS.
 * Removes common malicious tags and attributes.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: pseudo-protocol
    .replace(/on\w+=/gi, "") // Remove event handlers like onclick
    .trim();
}
