export type Severity = "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";

export const severityRank: Record<Severity, number> = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
};

export function normalizeSeverity(v?: string): Severity {
  if (!v) return "Unknown";
  const s = v.toLowerCase();
  if (s.includes("extreme")) return "Extreme";
  if (s.includes("severe") || s.includes("warning")) return "Severe";
  if (s.includes("moderate") || s.includes("watch")) return "Moderate";
  if (s.includes("minor") || s.includes("advisory")) return "Minor";
  return "Unknown";
}