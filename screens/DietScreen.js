import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import API from "../utils/api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DietScreen() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiet();
  }, []);

  const fetchDiet = async () => {
    try {
      const res = await API.get("/diet/recommend/today");
      setRecommendation(res.data);
    } catch (err) {
      console.error("Diet fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00c896" />
      </View>
    );
  }

  if (!recommendation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No diet recommendation available</Text>
      </View>
    );
  }

  const mealLabels = ["Breakfast", "Lunch", "Snack", "Dinner"];
  const mealsPerBlock = Math.ceil(recommendation.recommendedMeals.length / 4);
  const splitMeals = Array.from({ length: 4 }, (_, i) =>
    recommendation.recommendedMeals.slice(
      i * mealsPerBlock,
      (i + 1) * mealsPerBlock
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.heading}>🍽️ Today's Meals</Text>

        {splitMeals.map((mealGroup, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="food" size={20} color="#00c896" />{" "}
              {mealLabels[idx]}
            </Text>
            {mealGroup.map((item, i) => (
              <View key={i} style={styles.card}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.details}>
                  {item.quantity} | {item.calories} kcal
                </Text>
                <Text style={styles.macro}>
                  Protein: {item.protein}g | Carbs: {item.carbs}g | Fat:{" "}
                  {item.fats}g
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.heading}>📊 Total Summary</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            🔥 Calories: {recommendation.totalRecommendedCalories} kcal
          </Text>
          <Text style={styles.summaryText}>
            💪 Protein: {recommendation.totalRecommendedProtein}g
          </Text>
          <Text style={styles.summaryText}>
            🍞 Carbs: {recommendation.totalRecommendedCarbs}g
          </Text>
          <Text style={styles.summaryText}>
            🧈 Fat: {recommendation.totalRecommendedFats}g
          </Text>
          <Text style={styles.summaryText}>
            💧 Water: {recommendation.waterLiters} Liters/day
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
    color: "#00c896",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
  },
  details: {
    fontSize: 14,
    color: "#555",
  },
  macro: {
    fontSize: 13,
    color: "#777",
  },
  summaryBox: {
    backgroundColor: "#eefaf6",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
  },
});
