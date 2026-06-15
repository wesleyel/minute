/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Minute URL - Base URL of your Minute instance. */
  "minuteUrl": string,
  /** History Limit - Maximum number of recent descriptions to keep. */
  "historyLimit": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `start-timer` command */
  export type StartTimer = ExtensionPreferences & {}
  /** Preferences accessible in the `toggle-timer` command */
  export type ToggleTimer = ExtensionPreferences & {}
  /** Preferences accessible in the `stop-timer` command */
  export type StopTimer = ExtensionPreferences & {}
  /** Preferences accessible in the `timer-status` command */
  export type TimerStatus = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `start-timer` command */
  export type StartTimer = {}
  /** Arguments passed to the `toggle-timer` command */
  export type ToggleTimer = {}
  /** Arguments passed to the `stop-timer` command */
  export type StopTimer = {}
  /** Arguments passed to the `timer-status` command */
  export type TimerStatus = {}
}

