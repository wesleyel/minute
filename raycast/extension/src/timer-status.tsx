import {
  Action,
  ActionPanel,
  Icon,
  List,
  getPreferenceValues,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { FolderDropdown } from "./components/FolderDropdown";
import { useSelectedFolder } from "./hooks/use-selected-folder";
import { getStartTimerData } from "./lib/api";
import { folderLabel, formatDuration } from "./lib/format";
import {
  folderIcon,
  idleTimerIcon,
  runningTimerIcon,
  todayTotalIcon,
} from "./lib/icons";
import { getHistoryLimit } from "./lib/history";
import { moveRunningTimerToFolder } from "./lib/start-timer-action";
import type { Preferences } from "./lib/types";

async function loadTimerStatus() {
  return getStartTimerData(getHistoryLimit());
}

export default function Command() {
  const { data, isLoading, error, revalidate } = usePromise(
    loadTimerStatus,
    [],
  );
  const minuteUrl =
    getPreferenceValues<Preferences>().minuteUrl.trim() ||
    "http://localhost:4000";

  const status = data?.status;
  const folders = data?.folders ?? [];
  const preferredFolderId = status?.folder?.id;
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
              <Action.OpenInBrowser title="Open Minute" url={minuteUrl} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const today = formatDuration(status?.todayTotalDuration ?? 0);
  const runningEntry =
    status?.isRunning === true ? status.runningTimeEntry : null;
  const otherFolders =
    runningEntry && status?.folder
      ? folders.filter((folder) => folder.id !== status.folder?.id)
      : [];

  return (
    <List
      isLoading={isLoading || isFolderLoading}
      searchBarAccessory={runningEntry ? folderAccessory : null}
    >
      <List.Section title="Today">
        <List.Item
          icon={todayTotalIcon()}
          title={`Total ${today}`}
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                onAction={() => {
                  void revalidate();
                }}
              />
              <Action.OpenInBrowser title="Open Minute" url={minuteUrl} />
            </ActionPanel>
          }
        />
      </List.Section>

      {runningEntry && status ? (
        <List.Section title="Current Session">
          <List.Item
            icon={runningTimerIcon()}
            title={runningEntry.description}
            subtitle={formatDuration(status.currentDuration)}
            accessories={[
              {
                text: status.folder ? folderLabel(status.folder) : undefined,
              },
            ]}
            actions={
              <ActionPanel>
                {selectedFolder !== undefined &&
                selectedFolder.id !== status.folder?.id ? (
                  <Action
                    title={`Move to ${folderLabel(selectedFolder)}`}
                    icon={folderIcon(selectedFolder)}
                    onAction={() => {
                      void moveRunningTimerToFolder({
                        description: runningEntry.description,
                        folder: selectedFolder,
                        onSuccess: async () => {
                          await revalidate();
                        },
                      });
                    }}
                  />
                ) : null}
                {otherFolders.length > 0 ? (
                  <ActionPanel.Submenu
                    title="Move to Folder"
                    icon={Icon.Folder}
                  >
                    {otherFolders.map((folder) => (
                      <Action
                        key={folder.id}
                        title={folderLabel(folder)}
                        icon={folderIcon(folder)}
                        onAction={() => {
                          void moveRunningTimerToFolder({
                            description: runningEntry.description,
                            folder,
                            onSuccess: async () => {
                              await revalidate();
                            },
                          });
                        }}
                      />
                    ))}
                  </ActionPanel.Submenu>
                ) : null}
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={() => {
                    void revalidate();
                  }}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      ) : (
        <List.Section title="Current Session">
          <List.Item
            icon={idleTimerIcon()}
            title="Not running"
            actions={
              <ActionPanel>
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={() => {
                    void revalidate();
                  }}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
    </List>
  );
}
