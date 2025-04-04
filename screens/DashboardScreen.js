import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { ProgressChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer } from "expo-sensors";
import * as Notifications from "expo-notifications";
import API from "../utils/api";
import { registerBackgroundTask } from "../utils/backgroundTask";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const [user, setUser] = useState({ firstName: "User" });
  const [stepData, setStepData] = useState({
    stepCount: 0,
    stepTarget: 8000,
    caloriesBurned: 0,
    distanceKm: 0,
    timeMinutes: 0,
  });
  const [weeklySteps, setWeeklySteps] = useState([]);
  const [yValue, setYValue] = useState(0);

  const lastStepTime = useRef(0);
  const inStep = useRef(false);

  useEffect(() => {
    restoreStepsFromStorage();
    fetchUserAndSteps();
    registerBackgroundTask();
    setupNotifications();
    startAccelerometer();
  }, []);

  const restoreStepsFromStorage = async () => {
    const stored = await AsyncStorage.getItem("stepToday");
    if (stored) {
      const data = JSON.parse(stored);
      const today = new Date().toISOString().split("T")[0];
      if (data.date === today) {
        setStepData((prev) => ({
          ...prev,
          stepCount: data.stepCount,
          caloriesBurned: data.caloriesBurned,
          distanceKm: data.distanceKm,
        }));
      }
    }
  };

  const fetchUserAndSteps = async () => {
    try {
      const userRes = await API.get("/user/me");
      setUser(userRes.data);

      const today = new Date().toISOString().split("T")[0];
      const stepRes = await API.get(`/user/steps?date=${today}`);
      const stepCount = stepRes.data?.stepCount || 0;
      const calories = stepRes.data?.caloriesBurned || 0;
      const distance = stepRes.data?.distanceKm || 0;
      const time = stepRes.data?.timeMinutes || 0;

      setStepData({
        stepCount,
        stepTarget: userRes.data.stepTarget || 8000,
        caloriesBurned: calories,
        distanceKm: distance,
        timeMinutes: time,
      });

      const weekRes = await API.get(`/user/steps/weekly`);
      if (Array.isArray(weekRes.data) && weekRes.data.length > 0) {
        const formatted = weekRes.data.map((entry) => ({
          x: entry.day.slice(0, 3),
          y: entry.stepCount,
        }));
        setWeeklySteps(formatted);
      } else {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        setWeeklySteps(days.map((d) => ({ x: d, y: 0 })));
      }
    } catch (err) {
      console.log("Dashboard fetch error:", err);
    }
  };

  const startAccelerometer = () => {
    Accelerometer.setUpdateInterval(100);

    Accelerometer.addListener(({ y }) => {
      setYValue(y.toFixed(3));
      detectStep(y);
    });
  };

  const detectStep = (y) => {
    const now = Date.now();
    const RISE_THRESHOLD = 0.32;
    const FALL_THRESHOLD = 0.24;
    const MIN_STEP_GAP = 300;

    if (
      y > RISE_THRESHOLD &&
      !inStep.current &&
      now - lastStepTime.current > MIN_STEP_GAP
    ) {
      inStep.current = true;
    }

    if (y < FALL_THRESHOLD && inStep.current) {
      inStep.current = false;
      lastStepTime.current = now;

      setStepData((prev) => {
        const newSteps = prev.stepCount + 1;
        const newCalories = parseFloat((newSteps * 0.04).toFixed(2));
        const newDistance = parseFloat((newSteps * 0.0008).toFixed(2));
        AsyncStorage.setItem(
          "stepToday",
          JSON.stringify({
            date: new Date().toISOString().split("T")[0],
            stepCount: newSteps,
            caloriesBurned: newCalories,
            distanceKm: newDistance,
          })
        );
        return {
          ...prev,
          stepCount: newSteps,
          caloriesBurned: newCalories,
          distanceKm: newDistance,
        };
      });
    }
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🏃 Keep Moving!",
          body: "Don't forget to complete your step target today!",
        },
        trigger: { hour: 18, minute: 0, repeats: true },
      });
    }
  };

  const percentage =
    stepData.stepCount && stepData.stepTarget
      ? stepData.stepCount / stepData.stepTarget
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.greeting}>Hi, {user.firstName}! 👋</Text>

        <View style={styles.donutWrapper}>
          <ProgressChart
            data={{ data: [percentage] }}
            width={screenWidth - 60}
            height={200}
            strokeWidth={20}
            radius={80}
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
        <View style={styles.graphContainer}></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
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
  kpiBox: { alignItems: "center" },
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
  graphContainer: {
    height: 220,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
});
