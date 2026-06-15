import { getPreferenceValues } from "@raycast/api";
import type {
  ApiError,
  Folder,
  Preferences,
  RecentDescription,
  TimerAction,
  TimerBootstrap,
  TimerStatus,
} from "./types";

export function getMinuteUrl(): string {
  const { minuteUrl } = getPreferenceValues<Preferences>();
  const trimmed = minuteUrl.trim().replace(/\/$/, "");
  return trimmed.length > 0 ? trimmed : "http://localhost:4000";
}

async function parseResponse<T>(response: Response, path: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  const isHtml =
    text.trimStart().startsWith("<!DOCTYPE") ||
    text.trimStart().startsWith("<html");

  if (isHtml || !contentType.includes("application/json")) {
    throw new Error(
      `Minute returned HTML instead of JSON at ${path}. Check the Minute URL in extension preferences (currently ${getMinuteUrl()}).`,
    );
  }

  let body: T | ApiError;
  try {
    body = JSON.parse(text) as T | ApiError;
  } catch {
    throw new Error(`Minute returned invalid JSON at ${path}.`);
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Request failed (${String(response.status)})`;
    throw new Error(message);
  }

  return body as T;
}

export async function getTimerStatus(): Promise<TimerStatus> {
  const response = await fetch(`${getMinuteUrl()}/api/raycast/timer`);
  return parseResponse<TimerStatus>(response, "/api/raycast/timer");
}

export async function getStartTimerData(limit: number): Promise<{
  status: TimerStatus;
  folders: Folder[];
  recentDescriptions: RecentDescription[];
}> {
  const bootstrapPath = `/api/raycast/timer?include=meta&limit=${String(limit)}`;
  const response = await fetch(`${getMinuteUrl()}${bootstrapPath}`);
  const { folders, recentDescriptions, ...status } =
    await parseResponse<TimerBootstrap>(response, bootstrapPath);

  return { status, folders, recentDescriptions };
}

export async function postTimerAction(
  action: TimerAction,
): Promise<TimerStatus> {
  const response = await fetch(`${getMinuteUrl()}/api/raycast/timer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  return parseResponse<TimerStatus>(response, "/api/raycast/timer");
}
