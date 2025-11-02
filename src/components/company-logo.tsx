import { getCompanyInitials } from "@/lib/utils/get-company-initials";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  companyName: string;
  className?: string;
}

export function CompanyLogo({ companyName, className }: CompanyLogoProps) {
  const initials = getCompanyInitials(companyName);

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
