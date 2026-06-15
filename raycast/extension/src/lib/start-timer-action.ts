import { Toast, showToast } from "@raycast/api";
import { postTimerAction } from "./api";
import { folderLabel } from "./format";
import { rememberHistory } from "./history";
import type { Folder } from "./types";

export async function startTimerWithFolder({
  description,
  folder,
  onSuccess,
}: {
  description: string;
  folder: Folder | undefined;
  onSuccess?: () => Promise<void>;
}) {
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Description required",
    });
    return;
  }

  if (folder === undefined) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Folder required",
      message: "Select a folder from the dropdown.",
    });
    return;
  }

  try {
    const status = await postTimerAction({
      action: "start",
      description: trimmed,
      folderId: folder.id,
    });

    await rememberHistory({
      description: trimmed,
      folderId: folder.id,
      folderName: folder.name,
      folderEmoji: folder.emoji,
      folderColor: folder.color,
    });

    await showToast({
      style: Toast.Style.Success,
      title: status.isRunning ? "Timer started" : "Timer updated",
      message: `${trimmed} · ${folder.emoji} ${folder.name}`,
    });

    if (onSuccess !== undefined) {
      await onSuccess();
    }
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to start timer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function moveRunningTimerToFolder({
  description,
  folder,
  onSuccess,
}: {
  description: string;
  folder: Folder;
  onSuccess?: () => Promise<void>;
}) {
  try {
    await postTimerAction({
      action: "start",
      description,
      folderId: folder.id,
    });

    await showToast({
      style: Toast.Style.Success,
      title: "Folder updated",
      message: folderLabel(folder),
    });

    if (onSuccess !== undefined) {
      await onSuccess();
    }
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to move timer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
