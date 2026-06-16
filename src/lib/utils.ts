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

/**
 * Validates if a string is a valid email.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string is a valid phone number.
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
}
