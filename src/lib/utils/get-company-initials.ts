export function getCompanyInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/);

  if (words.length === 0) return "";

  // If single word, return first 2 characters
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  // If multiple words, return first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}
