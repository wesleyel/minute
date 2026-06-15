export type Folder = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type RunningTimeEntry = {
  description: string;
  folderId: string;
  startedAt: string;
};

export type TimerStatus = {
  isRunning: boolean;
  currentDuration: number;
  todayTotalDuration: number;
  runningTimeEntry: RunningTimeEntry | null;
  folder: Folder | null;
};

export type TimerBootstrap = TimerStatus & {
  folders: Folder[];
  recentDescriptions: RecentDescription[];
};

export type RecentDescription = {
  description: string;
  folder: Folder;
  lastUsedAt: string;
};

export type TimerAction =
  | {
      action: "start";
      description?: string;
      folderId?: string;
      folder?: string;
    }
  | { action: "stop" }
  | {
      action: "toggle";
      description?: string;
      folderId?: string;
      folder?: string;
    };

export type HistoryItem = {
  description: string;
  folderId: string;
  folderName: string;
  folderEmoji: string;
  folderColor?: string;
  lastUsedAt: string;
};

export type Preferences = {
  minuteUrl: string;
  historyLimit: string;
};

export type ApiError = {
  error: string;
};
