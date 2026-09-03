export type ManagedGroup = {
  id: string;
  name: string;
  type: "group" | "community";
  instanceId?: number;
  instanceName: string;
  participants: number;
  capacity: number;
  createdAt: string;
};

export const GROUPS_STORAGE_KEY = "tudozap-groups";

export function readGroups(): ManagedGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(GROUPS_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeGroups(groups: ManagedGroup[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
}
