import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import API from "../utils/api";
import { SafeAreaView } from "react-native-safe-area-context";

const avatars = [
  require("../assets/avatars/avatar1.webp"),
  require("../assets/avatars/avatar2.webp"),
  require("../assets/avatars/avatar3.webp"),
  require("../assets/avatars/avatar4.webp"),
  require("../assets/avatars/avatar5.webp"),
  require("../assets/avatars/avatar6.webp"),
  require("../assets/avatars/avatar7.webp"),
  require("../assets/avatars/avatar8.webp"),
  require("../assets/avatars/avatar9.webp"),
  require("../assets/avatars/avatar10.webp"),
];

export default function EditProfileScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    stepTarget: "",
    dailyCalorieGoal: "",
    preferences: "",
    avatar: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/me");
      const {
        firstName,
        lastName,
        email,
        age,
        gender,
        height,
        weight,
        stepTarget,
        dailyCalorieGoal,
        preferences,
        avatar,
      } = res.data;
      setForm({
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        age: age?.toString() || "",
        gender: gender || "",
        height: height?.toString() || "",
        weight: weight?.toString() || "",
        stepTarget: stepTarget?.toString() || "",
        dailyCalorieGoal: dailyCalorieGoal?.toString() || "",
        preferences: preferences?.type || "",
        avatar: avatar || "avatar1.png",
      });
    } catch (err) {
      console.log("Profile fetch error:", err);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        stepTarget: parseInt(form.stepTarget),
        dailyCalorieGoal: parseInt(form.dailyCalorieGoal),
        preferences: { type: form.preferences },
      };
      delete payload.email;
      delete payload.firstName;
      delete payload.lastName;

      await API.put("/user/profile", payload);
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (err) {
      console.log("Update error:", err);
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    }
  };

  return (
    <SafeAreaView>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        {/* Selected Avatar Preview */}
        <View style={styles.topAvatarWrapper}>
          <Image
            source={
              avatars[
                parseInt(
                  form.avatar.replace("avatar", "").replace(".png", "")
                ) - 1
              ]
            }
            style={styles.topAvatar}
          />
        </View>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={form.firstName}
          editable={false}
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={form.lastName}
          editable={false}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          editable={false}
          selectTextOnFocus={false}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={form.age}
          keyboardType="numeric"
          onChangeText={(text) => handleChange("age", text)}
        />

        <Text style={styles.label}>Gender</Text>
        <TextInput
          style={styles.input}
          value={form.gender}
          editable={false}
          selectTextOnFocus={false}
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={form.height}
          keyboardType="numeric"
          onChangeText={(text) => handleChange("height", text)}
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={form.weight}
          keyboardType="numeric"
          onChangeText={(text) => handleChange("weight", text)}
        />

        <Text style={styles.label}>Step Target</Text>
        <TextInput
          style={styles.input}
          value={form.stepTarget}
          keyboardType="numeric"
          onChangeText={(text) => handleChange("stepTarget", text)}
        />

        <Text style={styles.label}>Daily Calorie Goal</Text>
        <TextInput
          style={styles.input}
          value={form.dailyCalorieGoal}
          keyboardType="numeric"
          onChangeText={(text) => handleChange("dailyCalorieGoal", text)}
        />

        <Text style={styles.label}>Diet Preference</Text>
        <TextInput
          style={styles.input}
          value={form.preferences}
          onChangeText={(text) => handleChange("preferences", text)}
        />

        <Text style={styles.label}>Choose Avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.avatarContainer}>
            {avatars.map((src, index) => {
              const avatarName = `avatar${index + 1}.png`;
              return (
                <TouchableOpacity
                  key={avatarName}
                  onPress={() => handleChange("avatar", avatarName)}
                >
                  <Image
                    source={src}
                    style={[
                      styles.avatar,
                      form.avatar === avatarName && styles.selectedAvatar,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#555",
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
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  topAvatarWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  topAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00c896",
  },
  avatarContainer: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "transparent",
    marginRight: 10,
  },
  selectedAvatar: {
    borderColor: "#00c896",
  },
});
