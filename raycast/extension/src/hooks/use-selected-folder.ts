import { useLocalStorage } from "@raycast/utils";
import { useEffect } from "react";
import { SELECTED_FOLDER_KEY } from "../lib/selected-folder";
import type { Folder } from "../lib/types";

export function useSelectedFolder(
  folders: Folder[],
  preferredFolderId?: string,
) {
  const {
    value: selectedFolderId,
    setValue: setSelectedFolderId,
    isLoading,
  } = useLocalStorage<string>(SELECTED_FOLDER_KEY, "");

  useEffect(() => {
    if (isLoading || folders.length === 0) {
      return;
    }

    if (folders.some((folder) => folder.id === selectedFolderId)) {
      return;
    }

    const nextFolderId =
      preferredFolderId !== undefined &&
      folders.some((folder) => folder.id === preferredFolderId)
        ? preferredFolderId
        : folders[0].id;

    void setSelectedFolderId(nextFolderId);
  }, [
    folders,
    isLoading,
    preferredFolderId,
    selectedFolderId,
    setSelectedFolderId,
  ]);

  const selectedFolder =
    folders.find((folder) => folder.id === selectedFolderId) ?? folders[0];

  return {
    selectedFolderId: selectedFolder?.id ?? "",
    selectedFolder,
    setSelectedFolderId,
    isFolderLoading: isLoading,
  };
}
