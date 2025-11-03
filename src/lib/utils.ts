import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a simple, realistic avatar URL for a given name
 * Uses DiceBear's avataaars style for friendly, generic avatars
 */
export function getAvatarUrl(name: string): string {
  // Use the name as a seed for consistent avatars per person
  const seed = encodeURIComponent(name.trim().toLowerCase());
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}
