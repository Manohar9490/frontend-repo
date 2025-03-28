import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Picker,
  ScrollView,
} from "react-native";
import API from "../utils/api";
import { KeyboardAvoidingView, Platform } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileSetupScreen({ navigation }) {
  const [form, setForm] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    stepTarget: "",
    dailyCalorieGoal: "",
    preferences: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { age, gender, height, weight, stepTarget, dailyCalorieGoal } = form;

    if (
      !age ||
      !gender ||
      !height ||
      !weight ||
      !stepTarget ||
      !dailyCalorieGoal
    ) {
      return Alert.alert("Error", "Please fill in all required fields");
    }

    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Token before profile update:", token);
      const payload = {
        ...form,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        stepTarget: parseInt(form.stepTarget),
        dailyCalorieGoal: parseInt(form.dailyCalorieGoal),
        preferences: form.preferences ? { type: form.preferences } : {},
      };

      await API.put("/user/profile", payload);
      Alert.alert("Success", "Profile updated");
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (err) {
      console.log("Profile update error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Complete Your Profile</Text>

        <TextInput
          placeholder="Age"
          style={styles.input}
          keyboardType="numeric"
          value={form.age}
          onChangeText={(text) => handleChange("age", text)}
        />

        {/* <TextInput
          placeholder="Gender (Male/Female/Other)"
          style={styles.input}
          value={form.gender}
          onChangeText={(text) => handleChange("gender", text)}
        /> */}
        <View style={styles.input}>
          <RNPickerSelect
            onValueChange={(value) => handleChange("gender", value)}
            value={form.gender}
            placeholder={{ label: "Select Gender", value: null }}
            items={[
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
              { label: "Other", value: "Other" },
            ]}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: {
                fontSize: 16,
                color: "#000",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
              },
              inputAndroid: {
                fontSize: 16,
                color: "#000",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
              },
              placeholder: {
                color: "#999",
              },
            }}
          />
        </View>

        <TextInput
          placeholder="Height (cm)"
          style={styles.input}
          keyboardType="numeric"
          value={form.height}
          onChangeText={(text) => handleChange("height", text)}
        />

        <TextInput
          placeholder="Weight (kg)"
          style={styles.input}
          keyboardType="numeric"
          value={form.weight}
          onChangeText={(text) => handleChange("weight", text)}
        />

        <TextInput
          placeholder="Step Goal (steps/day)"
          style={styles.input}
          keyboardType="numeric"
          value={form.stepTarget}
          onChangeText={(text) => handleChange("stepTarget", text)}
        />

        <TextInput
          placeholder="Calorie Goal (kcal/day)"
          style={styles.input}
          keyboardType="numeric"
          value={form.dailyCalorieGoal}
          onChangeText={(text) => handleChange("dailyCalorieGoal", text)}
        />

        <View style={styles.input}>
          <RNPickerSelect
            onValueChange={(value) => handleChange("preferences", value)}
            value={form.preferences}
            placeholder={{
              label: "Select Diet Preference (optional)",
              value: "",
            }}
            items={[
              {
                label: "Vegetarian - No meat, fish or poultry",
                value: "Vegetarian",
              },
              {
                label: "Vegan - No animal products at all",
                value: "Vegan",
              },
              {
                label: "Keto - High-fat, very low-carb diet",
                value: "Keto",
              },
              {
                label: "Pescatarian - Includes fish but no meat",
                value: "Pescatarian",
              },
              {
                label: "Halal - Follows Islamic dietary laws",
                value: "Halal",
              },
              {
                label: "Kosher - Follows Jewish dietary laws",
                value: "Kosher",
              },
            ]}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: {
                fontSize: 16,
                color: "#000",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
              },
              inputAndroid: {
                fontSize: 16,
                color: "#000",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
              },
              placeholder: {
                color: "#999",
              },
            }}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save and Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#00c896",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    color: "#000",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  inputAndroid: {
    fontSize: 16,
    color: "#000",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  placeholder: {
    color: "#999",
  },
});
