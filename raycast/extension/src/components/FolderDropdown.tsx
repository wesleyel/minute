import { List } from "@raycast/api";
import { folderLabel } from "../lib/format";
import { folderIcon } from "../lib/icons";
import type { Folder } from "../lib/types";

type FolderDropdownProps = {
  folders: Folder[];
  value: string;
  onChange: (folderId: string) => void;
};

export function FolderDropdown({
  folders,
  value,
  onChange,
}: FolderDropdownProps) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <List.Dropdown tooltip="Folder" value={value} onChange={onChange}>
      {folders.map((folder) => (
        <List.Dropdown.Item
          key={folder.id}
          title={folderLabel(folder)}
          icon={folderIcon(folder)}
          value={folder.id}
        />
      ))}
    </List.Dropdown>
  );
}
