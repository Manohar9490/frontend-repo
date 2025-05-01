// DashboardScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import { ProgressChart, LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer } from "expo-sensors";
import * as Notifications from "expo-notifications";
import API from "../utils/api";
import { registerBackgroundTask } from "../utils/backgroundTask";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = () => {
  const [user, setUser] = useState({ firstName: "User", stepTarget: 8000 });
  const [stepData, setStepData] = useState({
    stepCount: 0,
    stepTarget: 8000,
    caloriesBurned: 0,
    distanceKm: 0,
    timeMinutes: 0,
  });
  const [weeklySteps, setWeeklySteps] = useState([]);
  const [yValue, setYValue] = useState(0);
  const [achievedTarget, setAchievedTarget] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastStepTime = useRef(0);
  const inStep = useRef(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUserAndSteps();
    await restoreStepsFromStorage();
    setIsRefreshing(false);
  }, [fetchUserAndSteps, restoreStepsFromStorage]);

  useEffect(() => {
    restoreStepsFromStorage();
    fetchUserAndSteps();
    registerBackgroundTask();
    requestNotificationPermission();
    startAccelerometer();
  }, [fetchUserAndSteps, restoreStepsFromStorage]);

  useEffect(() => {
    if (stepData.stepCount >= user.stepTarget && !achievedTarget) {
      setAchievedTarget(true);
      AsyncStorage.setItem("achievedToday", "true");
      Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Target Achieved!",
          body: "You've reached your step goal for today! Don't stop now, keep the momentum going!",
        },
        trigger: null,
      });
    } else if (stepData.stepCount < user.stepTarget && achievedTarget) {
      setAchievedTarget(false);
      AsyncStorage.removeItem("achievedToday");
    }
  }, [stepData.stepCount, user.stepTarget, achievedTarget]);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("Notification permissions not granted!");
    }
  };

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

  const fetchUserAndSteps = useCallback(async () => {
    try {
      const userRes = await API.get("/user/me");
      setUser(userRes.data);
      const target = userRes.data.stepTarget || 8000;
      setStepData((prev) => ({ ...prev, stepTarget: target }));
      await AsyncStorage.setItem("stepTarget", target.toString());
      const lastLogin = await AsyncStorage.getItem("lastLogin");
      const today = new Date().toISOString().split("T")[0];
      if (lastLogin !== today) {
        await AsyncStorage.setItem("lastLogin", today);
        await AsyncStorage.removeItem("appLaunchedToday"); // Reset for background task
      }

      const stepRes = await API.get(`/user/steps?date=${today}`);
      const stepCount = stepRes.data?.stepCount || 0;
      const calories = stepRes.data?.caloriesBurned || 0;
      const distance = stepRes.data?.distanceKm || 0;
      const time = stepRes.data?.timeMinutes || 0;

      setStepData({
        stepCount,
        stepTarget: target,
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
  }, []);

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

  const percentage =
    stepData.stepCount && stepData.stepTarget
      ? stepData.stepCount / stepData.stepTarget
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.greeting}>Hi, {user.firstName}! 👋</Text>

        {achievedTarget && (
          <View style={styles.achievementBanner}>
            <Text style={styles.achievementText}>
              Let's go......! Don't stop. Keep Moving
            </Text>
            {/*             <Text style={styles.achievementText}>Keep Moving! 💪</Text> */}
          </View>
        )}

        <View style={styles.donutWrapper}>
          <ProgressChart
            data={{ data: [Math.min(percentage, 0.999)] }}
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
          {/*           <View style={styles.kpiBox}>
           <Ionicons name="time-outline" size={24} color="#00C896" />
           <Text style={styles.kpiText}>{stepData.timeMinutes} min</Text>
          </View> */}
        </View>

        <Text style={styles.graphTitle}>Weekly Steps</Text>
        <View style={styles.graphContainer}>
          {weeklySteps.length > 0 && (
            <LineChart
              data={{
                labels: weeklySteps.map((item) => item.x),
                datasets: [
                  {
                    data: weeklySteps.map((item) => item.y),
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: "rgba(245, 245, 245, 1)",
                backgroundGradientFrom: "#f5f5f5",
                backgroundGradientTo: "#f5f5f5",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#007AFF",
                  fill: "#fff",
                },
                withHorizontalLines: false,
                withVerticalLines: false,
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          )}
          {weeklySteps.length === 0 && (
            <Text>No weekly step data available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(245, 245, 245, 1)",
    alignItems: "center",
    justifyContent: "center",
  },
  achievementBanner: {
    backgroundColor: "rgba(0, 200, 150, 1)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  achievementText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DashboardScreen;
