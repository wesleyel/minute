export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

export function folderLabel(folder: { emoji: string; name: string }): string {
  return `${folder.emoji} ${folder.name}`.trim();
}
