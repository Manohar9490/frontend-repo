import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ProgressChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Pedometer } from "expo-sensors";
import API from "../utils/api";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const BACKGROUND_TASK = "step-sync-task";

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stepData, setStepData] = useState({
    stepCount: 0,
    stepTarget: 8000,
    caloriesBurned: 0,
    distanceKm: 0,
    timeMinutes: 0,
  });
  const [weeklySteps, setWeeklySteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return navigation.replace("Login");

      const userRes = await API.get("/user/me");
      if (!userRes.data.profileCompleted) {
        return navigation.replace("ProfileSetup");
      }

      setUser(userRes.data);
      fetchSteps(userRes.data);
      startStepTracking();
      registerBackgroundTask();
    } catch (err) {
      console.log("Dashboard init error:", err);
      navigation.replace("Login");
    }
  };

  const fetchSteps = async (userData) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const stepRes = await API.get(`/user/steps?date=${today}`);

      if (stepRes.data) {
        const { stepCount, caloriesBurned, distanceKm, timeMinutes } =
          stepRes.data;
        setStepData({
          stepCount,
          stepTarget: userData.stepTarget || 8000,
          caloriesBurned,
          distanceKm,
          timeMinutes: timeMinutes || Math.floor(stepCount / 100),
        });
      }

      const weekRes = await API.get(`/user/steps/weekly`);
      if (weekRes.data && weekRes.data.length > 0) {
        const formatted = {
          labels: weekRes.data.map((entry) => entry.day.slice(0, 3)),
          datasets: [
            {
              data: weekRes.data.map((entry) => entry.stepCount),
            },
          ],
        };
        setWeeklySteps(formatted);
      } else {
        setWeeklySteps({
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
        });
      }

      setLoading(false);
    } catch (err) {
      console.log("Step fetch error:", err);
      setLoading(false);
    }
  };

  const startStepTracking = async () => {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    const steps = result.steps || 0;
    const calories = Math.floor(steps * 0.04);
    const distance = (steps * 0.0008).toFixed(2);

    await AsyncStorage.setItem(
      "stepToday",
      JSON.stringify({
        date: start.toISOString().split("T")[0],
        stepCount: steps,
        caloriesBurned: calories,
        distanceKm: parseFloat(distance),
      })
    );
  };

  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
        minimumInterval: 60 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (e) {
      console.log("Background task registration failed:", e);
    }
  };

  const percentage =
    stepData.stepCount && stepData.stepTarget
      ? stepData.stepCount / stepData.stepTarget
      : 0;

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00C896" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hi, {user.firstName} 👋</Text>

      <View style={styles.donutWrapper}>
        <ProgressChart
          data={{ data: [percentage] }}
          width={screenWidth - 60}
          height={200}
          strokeWidth={15}
          radius={60}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
          }}
          hideLegend
        />
        <Text style={styles.donutCenter}>{stepData.stepCount} steps</Text>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Ionicons name="flame-outline" size={24} color="#FF6347" />
          <Text style={styles.kpiText}>{stepData.caloriesBurned} kcal</Text>
        </View>
        <View style={styles.kpiBox}>
          <Ionicons name="walk-outline" size={24} color="#4682B4" />
          <Text style={styles.kpiText}>{stepData.distanceKm} km</Text>
        </View>
        <View style={styles.kpiBox}>
          <Ionicons name="time-outline" size={24} color="#00C896" />
          <Text style={styles.kpiText}>{stepData.timeMinutes} min</Text>
        </View>
      </View>

      <Text style={styles.graphTitle}>Weekly Steps</Text>
      <LineChart
        data={weeklySteps}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
          labelColor: () => "#333",
        }}
        bezier
        style={{ borderRadius: 10 }}
      />
    </ScrollView>
  );
}

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const stored = await AsyncStorage.getItem("stepToday");
    const data = JSON.parse(stored);
    if (!data) return BackgroundFetch.Result.NoData;

    await API.post("/user/steps", data);
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.log("Sync error:", error);
    return BackgroundFetch.Result.Failed;
  }
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
  },
  donutCenter: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "bold",
    color: "#00C896",
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  kpiBox: {
    alignItems: "center",
  },
  kpiText: {
    marginTop: 5,
    fontSize: 16,
    color: "#333",
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
});
