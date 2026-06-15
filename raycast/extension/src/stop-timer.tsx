import { showHUD, showToast, Toast } from "@raycast/api";
import { getTimerStatus, postTimerAction } from "./lib/api";

export default async function Command() {
  try {
    const status = await getTimerStatus();
    if (!status.isRunning) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No running timer",
      });
      return;
    }

    const result = await postTimerAction({ action: "stop" });
    await showHUD(result.isRunning ? "Still running" : "Stopped");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Stop failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
