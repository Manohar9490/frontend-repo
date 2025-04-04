import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as Device from "expo-device";
// import * as Pedometer from "expo-sensors";
import AppNavigator from "./navigation/AppNavigator";
import { registerBackgroundTask } from "./utils/backgroundTask";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const syncLocalStepsToBackend = async () => {
  const stored = await AsyncStorage.getItem("stepToday");
  if (!stored) return;

  try {
    const stepData = JSON.parse(stored);
    await API.post("/user/steps", stepData);
    console.log("Step data synced on login/startup");
  } catch (err) {
    console.log("Failed to sync steps:", err.message);
  }
};

// Permission request function
async function askForPermissions() {
  try {
    if (Device.isDevice) {
      // Push notifications permission
      const { status: notificationStatus } =
        await Notifications.requestPermissionsAsync();
      if (notificationStatus !== "granted") {
        console.log(" Notification permission denied");
      } else {
        console.log(" Notification permission granted");
      }

      // Location permission
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        console.log(" Location permission denied");
      } else {
        console.log(" Location permission granted");
      }

      // const isAvailable = await Pedometer.isAvailableAsync();
      // if (!isAvailable) {
      //   console.log("🚫 Pedometer is not available on this device.");
      // } else {
      //   console.log("✅ Pedometer is available!");
      // }

      //  Correct permission for Activity Recognition (Pedometer)
      // const { granted } = await Pedometer.requestPermissionsAsync();
      // if (!granted) {
      //   console.log(" Activity Recognition permission denied");
      // } else {
      //   console.log(" Activity Recognition permission granted");
      // }
    } else {
      console.log(
        " Must use a physical device for Push Notifications and Pedometer."
      );
    }
  } catch (err) {
    console.error(" Permission error:", err);
  }
}

export default function App() {
  useEffect(() => {
    askForPermissions();
    registerBackgroundTask(); // Register background sync
    syncLocalStepsToBackend();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
