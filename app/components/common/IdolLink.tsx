"use client";

import Link from "next/link";

interface IdolData {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
}

interface IdolLinkProps {
  idol: IdolData;
  className?: string;
  showStageNameFirst?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export default function IdolLink({
  idol,
  className = "",
  showStageNameFirst = true,
  onClick
}: IdolLinkProps) {
  const displayName = showStageNameFirst
    ? idol.stageName || idol.name
    : idol.name;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <Link
      href={`/idols/${idol.slug}`}
      className={`text-indigo-600 hover:text-indigo-800 hover:underline transition-colors ${className}`}
      onClick={handleClick}
    >
      {displayName}
    </Link>
  );
}
