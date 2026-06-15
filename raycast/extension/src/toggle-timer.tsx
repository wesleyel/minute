import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  showToast,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { FolderDropdown } from "./components/FolderDropdown";
import { useSelectedFolder } from "./hooks/use-selected-folder";
import { getStartTimerData, postTimerAction } from "./lib/api";
import { folderLabel } from "./lib/format";
import { idleTimerIcon, resumeTimerIcon, runningTimerIcon } from "./lib/icons";
import { getLastHistoryItem } from "./lib/history";
import { startTimerWithFolder } from "./lib/start-timer-action";

async function loadToggleData() {
  const [{ status, folders }, lastHistory] = await Promise.all([
    getStartTimerData(1),
    getLastHistoryItem(),
  ]);

  return { status, folders, lastHistory };
}

export default function Command() {
  const { data, isLoading, error, revalidate } = usePromise(loadToggleData, []);

  const folders = data?.folders ?? [];
  const preferredFolderId =
    data?.status.folder?.id ?? data?.lastHistory?.folderId;
  const {
    selectedFolder,
    selectedFolderId,
    setSelectedFolderId,
    isFolderLoading,
  } = useSelectedFolder(folders, preferredFolderId);

  const folderAccessory =
    folders.length > 0 ? (
      <FolderDropdown
        folders={folders}
        value={selectedFolderId}
        onChange={setSelectedFolderId}
      />
    ) : null;

  const selectedFolderLabel =
    selectedFolder !== undefined
      ? folderLabel(selectedFolder)
      : "Select folder";

  async function stopTimer() {
    try {
      await postTimerAction({ action: "stop" });
      await showToast({
        style: Toast.Style.Success,
        title: "Timer stopped",
      });
      await revalidate();
    } catch (stopError) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Stop failed",
        message:
          stopError instanceof Error ? stopError.message : "Unknown error",
      });
    }
  }

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could not connect to Minute"
          description={error.message}
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={() => {
                  void revalidate();
                }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const isRunning = data?.status.isRunning === true;
  const runningEntry = isRunning && data ? data.status.runningTimeEntry : null;

  if (runningEntry && data) {
    return (
      <List isLoading={isLoading}>
        <List.Section title="Running">
          <List.Item
            icon={runningTimerIcon()}
            title={runningEntry.description}
            subtitle={
              data.status.folder ? folderLabel(data.status.folder) : undefined
            }
            actions={
              <ActionPanel>
                <Action
                  title="Stop Timer"
                  icon={Icon.Stop}
                  style={Action.Style.Destructive}
                  onAction={() => {
                    void stopTimer();
                  }}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      </List>
    );
  }

  const lastHistory = data?.lastHistory;

  return (
    <List
      isLoading={isLoading || isFolderLoading}
      searchBarAccessory={folderAccessory}
    >
      {lastHistory ? (
        <List.Section title="Resume" subtitle={selectedFolderLabel}>
          <List.Item
            icon={resumeTimerIcon()}
            title={lastHistory.description}
            subtitle={`${folderLabel({ emoji: lastHistory.folderEmoji, name: lastHistory.folderName })} → ${selectedFolderLabel}`}
            actions={
              <ActionPanel>
                <Action
                  title={`Start in ${selectedFolderLabel}`}
                  icon={Icon.Play}
                  onAction={() => {
                    void startTimerWithFolder({
                      description: lastHistory.description,
                      folder: selectedFolder,
                      onSuccess: async () => {
                        await revalidate();
                      },
                    });
                  }}
                />
                <Action
                  title={`Resume in ${folderLabel({ emoji: lastHistory.folderEmoji, name: lastHistory.folderName })}`}
                  icon={Icon.ArrowClockwise}
                  onAction={() => {
                    void startTimerWithFolder({
                      description: lastHistory.description,
                      folder: {
                        id: lastHistory.folderId,
                        name: lastHistory.folderName,
                        emoji: lastHistory.folderEmoji,
                        color: lastHistory.folderColor ?? "",
                      },
                      onSuccess: async () => {
                        await revalidate();
                      },
                    });
                  }}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      ) : (
        <List.EmptyView
          icon={idleTimerIcon()}
          title="No cached session"
          description="Run Start Timer once, or pick a folder and start from there."
        />
      )}
    </List>
  );
}
