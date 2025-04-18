// backgroundTask.js
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";
import * as Notifications from "expo-notifications";

const STEP_SYNC_TASK = "step-sync-task";
const NOTIFICATION_TASK = "notification-task";

// Step Sync Background Task
if (!TaskManager.isTaskDefined(STEP_SYNC_TASK)) {
  TaskManager.defineTask(STEP_SYNC_TASK, async () => {
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

// Notification Background Task
if (!TaskManager.isTaskDefined(NOTIFICATION_TASK)) {
  TaskManager.defineTask(NOTIFICATION_TASK, async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const today = now.toISOString().split("T")[0];
      const lastLogin = await AsyncStorage.getItem("lastLogin");
      const storedSteps = await AsyncStorage.getItem("stepToday");
      const userTargetStr = await AsyncStorage.getItem("stepTarget");
      const stepTarget = userTargetStr ? parseInt(userTargetStr) : 8000;
      let stepCount = 0;
      if (storedSteps) {
        const data = JSON.parse(storedSteps);
        if (data.date === today) {
          stepCount = data.stepCount;
        }
      }

      const sendNotification = async (title, body) => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 250, 250, 250],
          },
          trigger: null,
        });
      };

      // Morning motivation (8:00 AM)
      if (currentHour === 8 && currentMinute === 0) {
        await sendNotification(
          "☀️ Good Morning!",
          "Start your day strong! Every step counts towards a healthier you."
        );
      }

      // Afternoon progress (1:00 PM)
      if (currentHour === 13 && currentMinute === 0) {
        await sendNotification(
          "🚶 Progress Check!",
          `You've taken ${stepCount} steps so far. Keep up the great work!`
        );
      }

      // Evening reminder (6:00 PM)
      if (currentHour === 18 && currentMinute === 0) {
        await sendNotification(
          "Evening Steps!",
          "Almost there! Make the most of the rest of your day to reach your goal."
        );
      }

      // Night encouragement (9:00 PM)
      if (currentHour === 21 && currentMinute === 0) {
        await sendNotification(
          "🌙 One Last Push!",
          "Even a short walk tonight can make a difference for tomorrow. You've got this!"
        );
      }

      // "Start Your Journey" on first login
      const appLaunchedToday = await AsyncStorage.getItem("appLaunchedToday");
      if (lastLogin === today && appLaunchedToday !== "true") {
        await sendNotification(
          "🚀 Start Your Journey!",
          "Welcome back! Let's make today active and healthy."
        );
        await AsyncStorage.setItem("appLaunchedToday", "true");
      } else if (lastLogin !== today) {
        await AsyncStorage.setItem("appLaunchedToday", "false");
      }

      // Achievement notification
      const achievedTodayStr = await AsyncStorage.getItem("achievedToday");
      const achievedToday = achievedTodayStr === "true";
      if (stepCount >= stepTarget && !achievedToday) {
        await sendNotification(
          "🎉 Target Achieved!",
          "You've reached your step goal for today! Don't stop now, keep the momentum going!"
        );
        await AsyncStorage.setItem("achievedToday", "true");
      } else if (stepCount < stepTarget && achievedToday) {
        await AsyncStorage.removeItem("achievedToday"); // Reset for the next day
      }

      console.log("Notification task ran at:", new Date().toLocaleTimeString());
      return BackgroundFetch.Result.NewData; // Indicate there might be new data (notifications)
    } catch (error) {
      console.error("Notification task error:", error);
      return BackgroundFetch.Result.Failed;
    }
  });
}

export const registerBackgroundTask = async () => {
  try {
    // Register step sync task
    const isStepSyncRegistered =
      await TaskManager.isTaskRegisteredAsync(STEP_SYNC_TASK);
    if (!isStepSyncRegistered) {
      await BackgroundFetch.registerTaskAsync(STEP_SYNC_TASK, {
        minimumInterval: 60 * 60, // 1 hour
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Step sync background task registered.");
    } else {
      console.log("Step sync background task already registered.");
    }

    // Register notification task
    const isNotificationTaskRegistered =
      await TaskManager.isTaskRegisteredAsync(NOTIFICATION_TASK);
    if (!isNotificationTaskRegistered) {
      await BackgroundFetch.registerTaskAsync(NOTIFICATION_TASK, {
        minimumInterval: 60 * 5, // Check for notifications every 5 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Notification background task registered.");
    } else {
      console.log("Notification background task already registered.");
    }
  } catch (err) {
    console.log("Failed to register background tasks:", err);
  }
};
