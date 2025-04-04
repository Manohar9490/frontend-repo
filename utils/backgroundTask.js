import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";

const TASK_NAME = "step-sync-task";

if (!TaskManager.isTaskDefined(TASK_NAME)) {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      const stored = await AsyncStorage.getItem("stepToday");
      if (!stored) return BackgroundFetch.Result.NoData;

      const data = JSON.parse(stored);
      await API.post("/user/steps", data);
      console.log("Steps synced successfully");
      return BackgroundFetch.Result.NewData;
    } catch (err) {
      console.log("Background sync error:", err);
      return BackgroundFetch.Result.Failed;
    }
  });
}

export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync("step-sync-task", {
      minimumInterval: 60 * 60, // 1 hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("Background task registered.");
  } catch (err) {
    console.log("Failed to register background task:", err);
  }
};
