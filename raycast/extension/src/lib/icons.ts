import { Color, Icon, type Image } from "@raycast/api";

type FolderLike = {
  color?: string;
};

export function folderIcon(folder: FolderLike): Image.ImageLike {
  if (folder.color !== undefined && folder.color.length > 0) {
    return { source: Icon.Folder, tintColor: folder.color };
  }

  return Icon.Folder;
}

export function historyItemIcon(item: FolderLike): Image.ImageLike {
  if (item.color !== undefined && item.color.length > 0) {
    return { source: Icon.Clock, tintColor: item.color };
  }

  return Icon.Clock;
}

export function runningTimerIcon(): Image.ImageLike {
  return { source: Icon.CircleProgress, tintColor: Color.Green };
}

export function newTimerIcon(): Image.ImageLike {
  return Icon.Plus;
}

export function resumeTimerIcon(): Image.ImageLike {
  return Icon.Play;
}

export function stopTimerIcon(): Image.ImageLike {
  return { source: Icon.Stop, tintColor: Color.Red };
}

export function todayTotalIcon(): Image.ImageLike {
  return Icon.Stopwatch;
}

export function idleTimerIcon(): Image.ImageLike {
  return Icon.Moon;
}
