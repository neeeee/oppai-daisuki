/**
 * Date utility functions to ensure consistent formatting
 * and prevent hydration mismatches between server and client
 */

// Consistent date formatting options
export const DATE_FORMAT_OPTIONS = {
  short: {
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
  },
  long: {
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  },
  numeric: {
    year: "numeric" as const,
    month: "2-digit" as const,
    day: "2-digit" as const,
  },
};

export const TIME_FORMAT_OPTIONS = {
  short: {
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  },
  full: {
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    second: "2-digit" as const,
  },
};

/**
 * Format date with consistent locale to prevent hydration mismatches
 * Always uses 'en-US' locale for consistency
 */
export const formatDate = (
  dateString: string | Date,
  format: "short" | "long" | "numeric" = "short",
): string => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", DATE_FORMAT_OPTIONS[format]);
};

/**
 * Format time with consistent locale
 */
export const formatTime = (
  dateString: string | Date,
  format: "short" | "full" = "short",
): string => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", TIME_FORMAT_OPTIONS[format]);
};

/**
 * Format relative time (e.g., "2 days ago")
 * Uses Math.floor for consistent rounding to prevent hydration issues
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();

  if (isNaN(date.getTime())) {
    return "";
  }

  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "1 day ago";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
};

/**
 * Format date and time together
 */
export const formatDateTime = (
  dateString: string | Date,
  dateFormat: "short" | "long" | "numeric" = "short",
  timeFormat: "short" | "full" = "short",
): string => {
  const formattedDate = formatDate(dateString, dateFormat);
  const formattedTime = formatTime(dateString, timeFormat);

  return `${formattedDate} at ${formattedTime}`;
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string | Date): boolean => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is within the last week
 */
export const isWithinLastWeek = (dateString: string | Date): boolean => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return date >= weekAgo && date <= now;
};

/**
 * Get age from birth date
 */
export const getAge = (birthDateString: string | Date): number | null => {
  const birthDate =
    typeof birthDateString === "string"
      ? new Date(birthDateString)
      : birthDateString;

  if (isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Format duration in minutes to human readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format reading time
 */
export const formatReadingTime = (minutes: number): string => {
  return `${Math.ceil(minutes)} min read`;
};

/**
 * Format count with K/M suffixes and handle undefined/null values
 */
export const formatCount = (count: number | undefined | null): string => {
  if (!count || count === 0) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};
