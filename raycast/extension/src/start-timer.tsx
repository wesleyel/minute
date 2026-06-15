import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  getPreferenceValues,
  showToast,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import { FolderDropdown } from "./components/FolderDropdown";
import { useSelectedFolder } from "./hooks/use-selected-folder";
import { getStartTimerData, postTimerAction } from "./lib/api";
import { folderLabel, formatDuration } from "./lib/format";
import {
  folderIcon,
  historyItemIcon,
  idleTimerIcon,
  newTimerIcon,
  runningTimerIcon,
} from "./lib/icons";
import {
  getHistoryLimit,
  getLocalHistory,
  mergeHistory,
  removeFromHistory,
} from "./lib/history";
import {
  moveRunningTimerToFolder,
  startTimerWithFolder,
} from "./lib/start-timer-action";
import type { Folder, HistoryItem, Preferences } from "./lib/types";

async function loadStartTimerData() {
  const limit = getHistoryLimit();
  const localHistory = await getLocalHistory();
  const { status, folders, recentDescriptions } =
    await getStartTimerData(limit);

  return {
    status,
    folders,
    history: mergeHistory(localHistory, recentDescriptions, limit),
  };
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, isLoading, error, revalidate } = usePromise(
    loadStartTimerData,
    [],
  );

  const folders = data?.folders ?? [];
  const preferredFolderId = data?.status.folder?.id;
  const {
    selectedFolder,
    selectedFolderId,
    setSelectedFolderId,
    isFolderLoading,
  } = useSelectedFolder(folders, preferredFolderId);

  const trimmedSearch = searchText.trim();
  const filteredHistory = useMemo(() => {
    const history = data?.history ?? [];
    if (trimmedSearch.length === 0) {
      return history;
    }
    const query = trimmedSearch.toLowerCase();
    return history.filter((item) =>
      item.description.toLowerCase().includes(query),
    );
  }, [data?.history, trimmedSearch]);

  const showCreateItem =
    trimmedSearch.length > 0 &&
    !filteredHistory.some(
      (item) => item.description.toLowerCase() === trimmedSearch.toLowerCase(),
    );

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
        title: "Failed to stop timer",
        message:
          stopError instanceof Error ? stopError.message : "Unknown error",
      });
    }
  }

  async function handleRemoveFromHistory(description: string) {
    await removeFromHistory(description);
    await revalidate();
  }

  function renderMoveToFolderActions(
    description: string,
    currentFolderId?: string,
  ) {
    const otherFolders = folders.filter(
      (folder) => folder.id !== currentFolderId,
    );
    if (otherFolders.length === 0) {
      return null;
    }

    return (
      <ActionPanel.Submenu title="Move to Folder" icon={Icon.Folder}>
        {otherFolders.map((folder) => (
          <Action
            key={folder.id}
            title={folderLabel(folder)}
            icon={folderIcon(folder)}
            onAction={() => {
              void moveRunningTimerToFolder({
                description,
                folder,
                onSuccess: async () => {
                  await revalidate();
                },
              });
            }}
          />
        ))}
      </ActionPanel.Submenu>
    );
  }

  function renderStartAction(description: string, folder?: Folder) {
    const targetFolder = folder ?? selectedFolder;
    const title =
      targetFolder !== undefined
        ? `Start in ${folderLabel(targetFolder)}`
        : "Start Timer";

    return (
      <Action
        title={title}
        icon={Icon.Play}
        onAction={() => {
          void startTimerWithFolder({
            description,
            folder: targetFolder,
            onSuccess: async () => {
              await revalidate();
            },
          });
        }}
      />
    );
  }

  function renderHistoryActions(item: HistoryItem) {
    return (
      <ActionPanel>
        {renderStartAction(item.description)}
        <Action
          title={`Start in ${folderLabel({ emoji: item.folderEmoji, name: item.folderName })}`}
          icon={Icon.ArrowClockwise}
          onAction={() => {
            void setSelectedFolderId(item.folderId);
            void startTimerWithFolder({
              description: item.description,
              folder: {
                id: item.folderId,
                name: item.folderName,
                emoji: item.folderEmoji,
                color: item.folderColor ?? "",
              },
              onSuccess: async () => {
                await revalidate();
              },
            });
          }}
        />
        <Action
          title="Remove from History"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          onAction={() => {
            void handleRemoveFromHistory(item.description);
          }}
        />
      </ActionPanel>
    );
  }

  const minuteUrl =
    getPreferenceValues<Preferences>().minuteUrl.trim() ||
    "http://localhost:4000";
  const runningEntry =
    data?.status.isRunning === true ? data.status.runningTimeEntry : null;

  return (
    <List
      isLoading={isLoading || isFolderLoading}
      searchBarPlaceholder="Search or type a new description..."
      searchBarAccessory={folderAccessory}
      onSearchTextChange={setSearchText}
      throttle
    >
      {error ? (
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
      ) : null}

      {!error && runningEntry && data ? (
        <List.Section title="Running">
          <List.Item
            icon={runningTimerIcon()}
            title={runningEntry.description}
            subtitle={formatDuration(data.status.currentDuration)}
            accessories={[
              {
                text: data.status.folder
                  ? folderLabel(data.status.folder)
                  : undefined,
              },
            ]}
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
                {renderMoveToFolderActions(
                  runningEntry.description,
                  data.status.folder?.id,
                )}
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
      ) : null}

      {!error && showCreateItem ? (
        <List.Section title="New" subtitle={selectedFolderLabel}>
          <List.Item
            icon={newTimerIcon()}
            title={`Start "${trimmedSearch}"`}
            subtitle={selectedFolderLabel}
            actions={
              <ActionPanel>{renderStartAction(trimmedSearch)}</ActionPanel>
            }
          />
        </List.Section>
      ) : null}

      {!error && filteredHistory.length > 0 ? (
        <List.Section title="Recent" subtitle={selectedFolderLabel}>
          {filteredHistory.map((item) => (
            <List.Item
              key={item.description}
              icon={historyItemIcon({ color: item.folderColor })}
              title={item.description}
              subtitle={folderLabel({
                emoji: item.folderEmoji,
                name: item.folderName,
              })}
              accessories={[
                {
                  date: new Date(item.lastUsedAt),
                  tooltip: "Last used",
                },
              ]}
              actions={renderHistoryActions(item)}
            />
          ))}
        </List.Section>
      ) : null}

      {!error &&
      !isLoading &&
      filteredHistory.length === 0 &&
      !showCreateItem ? (
        <List.EmptyView
          icon={idleTimerIcon()}
          title="No recent descriptions"
          description="Pick a folder above, then type a description to start."
        />
      ) : null}
    </List>
  );
}
