import { getPreferenceValues, LocalStorage } from "@raycast/api";
import type { HistoryItem, Preferences, RecentDescription } from "./types";

const HISTORY_KEY = "description-history";

export function getHistoryLimit(): number {
  const { historyLimit } = getPreferenceValues<Preferences>();
  const parsed = Number(historyLimit);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 20;
  }
  return Math.min(Math.floor(parsed), 50);
}

export async function getLocalHistory(): Promise<HistoryItem[]> {
  const raw = await LocalStorage.getItem<string>(HISTORY_KEY);
  if (raw === undefined) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setLocalHistory(items: HistoryItem[]): Promise<void> {
  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function mergeHistory(
  local: HistoryItem[],
  remote: RecentDescription[],
  limit: number,
): HistoryItem[] {
  const map = new Map<string, HistoryItem>();

  for (const item of local) {
    map.set(item.description, item);
  }

  for (const item of remote) {
    const next: HistoryItem = {
      description: item.description,
      folderId: item.folder.id,
      folderName: item.folder.name,
      folderEmoji: item.folder.emoji,
      folderColor: item.folder.color,
      lastUsedAt: item.lastUsedAt,
    };
    const existing = map.get(item.description);
    if (
      existing === undefined ||
      new Date(next.lastUsedAt).getTime() >
        new Date(existing.lastUsedAt).getTime()
    ) {
      map.set(item.description, next);
    }
  }

  return [...map.values()]
    .sort(
      (left, right) =>
        new Date(right.lastUsedAt).getTime() -
        new Date(left.lastUsedAt).getTime(),
    )
    .slice(0, limit);
}

export async function rememberHistory(entry: {
  description: string;
  folderId: string;
  folderName: string;
  folderEmoji: string;
  folderColor?: string;
}): Promise<void> {
  const limit = getHistoryLimit();
  const current = await getLocalHistory();
  const next = [
    {
      ...entry,
      lastUsedAt: new Date().toISOString(),
    },
    ...current.filter((item) => item.description !== entry.description),
  ].slice(0, limit);
  await setLocalHistory(next);
}

export async function removeFromHistory(description: string): Promise<void> {
  const current = await getLocalHistory();
  await setLocalHistory(
    current.filter((item) => item.description !== description),
  );
}

export async function getLastHistoryItem(): Promise<HistoryItem | undefined> {
  const history = await getLocalHistory();
  return history[0];
}
