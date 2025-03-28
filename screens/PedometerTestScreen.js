import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Pedometer } from "expo-sensors";
import * as Permissions from "expo-permissions";

export default function PedometerTestScreen({ navigation }) {
  const [isPedometerAvailable, setIsPedometerAvailable] =
    useState("Checking...");
  const [stepCount, setStepCount] = useState(0);
  const [subscription, setSubscription] = useState(null);

  // ✅ Request permission for motion and fitness
  const requestPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.MOTION);
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access motion is required for step counting."
      );
    }
  };

  // ✅ Check if Pedometer is available and start step counting
  const checkPedometerAndSubscribe = async () => {
    const available = await Pedometer.isAvailableAsync();
    console.log("Pedometer Available:", available);

    setIsPedometerAvailable(
      available ? "Pedometer is available ✅" : "Pedometer not available ❌"
    );

    if (available) {
      startStepCounter();
      subscribeToStepUpdates();
    }
  };

  // ✅ Start Step Counting from Midnight
  const startStepCounter = async () => {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    console.log("Initial Step Count:", result.steps);

    setStepCount(result.steps || 0);
  };

  // ✅ Subscribe to Real-Time Step Updates
  const subscribeToStepUpdates = () => {
    const pedometerSubscription = Pedometer.watchStepCount((result) => {
      console.log("Step Update:", result.steps);
      setStepCount(result.steps);
    });

    setSubscription(pedometerSubscription);
  };

  // ✅ Unsubscribe from Step Updates
  const unsubscribe = () => {
    if (subscription) {
      subscription.remove();
    }
    setSubscription(null);
  };

  // ✅ Handle Subscription and Unsubscription
  useEffect(() => {
    requestPermissions();
    checkPedometerAndSubscribe();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedometer Test</Text>
      <Text style={styles.status}>{isPedometerAvailable}</Text>
      <Text style={styles.stepCount}>
        Steps Taken Today: <Text style={styles.bold}>{stepCount}</Text>
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert("Pedometer Working?", `${stepCount} steps`)}
      >
        <Text style={styles.buttonText}>Check Steps</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  status: { fontSize: 16, marginBottom: 10, color: "#666" },
  stepCount: { fontSize: 18, marginBottom: 20 },
  bold: { fontWeight: "bold", color: "#00c896" },
  button: {
    backgroundColor: "#00c896",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
