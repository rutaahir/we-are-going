import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasPermission(user: any, required: string[]) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.role === "community_admin" && !user.customRoleName) return true;
  
  const p = Array.isArray(user.effectivePermissions) ? user.effectivePermissions : (Array.isArray(user.permissions) ? user.permissions : []);
  return required.some(req => p.includes(req));
}

export function calculateAge(dobString: string): string {
  if (!dobString) return "";
  const parts = dobString.split(/[-/]/);
  if (parts.length < 3) return "";
  
  let year = 0;
  let month = 0; // 0-indexed
  let day = 0;
  
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (parts[2].length === 4) {
    // DD-MM-YYYY
    year = parseInt(parts[2], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[0], 10);
  } else {
    // Fallback to Date parsing
    const parsed = new Date(dobString);
    if (isNaN(parsed.getTime())) return "";
    year = parsed.getFullYear();
    month = parsed.getMonth();
    day = parsed.getDate();
  }
  
  if (isNaN(year) || isNaN(month) || isNaN(day) || year < 1900) {
    return "";
  }
  
  const today = new Date();
  const birthDateObj = new Date(year, month, day);
  
  // Set time of today to 00:00:00 for accurate day comparison
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birthDateObj > todayMidnight) {
    return "";
  }
  
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age >= 0 ? String(age) : "";
}

