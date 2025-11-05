"use client";

import { getCompanyInitials } from "@/lib/utils/get-company-initials";
import { cn } from "@/lib/utils";
import { getLogoDevUrl } from "@/lib/logodev";
import Image from "next/image";
import { useState } from "react";

interface CompanyLogoProps {
  companyName: string;
  website?: string | null;
  className?: string;
}

export function CompanyLogo({ companyName, website, className }: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getCompanyInitials(companyName);
  const logoUrl = getLogoDevUrl(website);

  // Generate a consistent soft gradient based on the company name
  const getGradientFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const gradients = [
      "bg-gradient-to-br from-blue-100 to-blue-200",
      "bg-gradient-to-br from-green-100 to-green-200",
      "bg-gradient-to-br from-purple-100 to-purple-200",
      "bg-gradient-to-br from-orange-100 to-orange-200",
      "bg-gradient-to-br from-pink-100 to-pink-200",
      "bg-gradient-to-br from-indigo-100 to-indigo-200",
      "bg-gradient-to-br from-cyan-100 to-cyan-200",
      "bg-gradient-to-br from-teal-100 to-teal-200",
    ];

    const textColors = [
      "text-blue-700",
      "text-green-700",
      "text-purple-700",
      "text-orange-700",
      "text-pink-700",
      "text-indigo-700",
      "text-cyan-700",
      "text-teal-700",
    ];

    const index = Math.abs(hash) % gradients.length;
    return {
      gradient: gradients[index],
      textColor: textColors[index],
    };
  };

  const { gradient, textColor } = getGradientFromName(companyName);

  // If we have a logo URL and no error, show the image
  if (logoUrl && !imageError) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg overflow-hidden bg-white", className)}>
        <Image
          src={logoUrl}
          alt={`${companyName} logo`}
          width={200}
          height={200}
          className="w-full h-full object-contain p-1"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg text-xs font-semibold",
        gradient,
        textColor,
        className
      )}
    >
      {initials}
    </div>
  );
}
