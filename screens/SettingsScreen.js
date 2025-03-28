import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../utils/api";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [ratingVisible, setRatingVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await API.post("/auth/logout");
    navigation.replace("Login");
  };

  const submitRating = () => {
    console.log("Rating submitted:", rating, feedback);
    setRatingVisible(false);
    Alert.alert("Thanks!", "We appreciate your feedback.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Ionicons name="person-outline" size={24} />
        <Text style={styles.label}>Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("PrivacySecurity")}
      >
        <Ionicons name="lock-closed-outline" size={24} />
        <Text style={styles.label}>Privacy & Security</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => setRatingVisible(true)}
      >
        <Ionicons name="star-outline" size={24} />
        <Text style={styles.label}>Rate App</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() =>
          Alert.alert("Contact Us", "Email us at support@eatfitgo.com")
        }
      >
        <Ionicons name="mail-outline" size={24} />
        <Text style={styles.label}>Contact Us</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="red" />
        <Text style={[styles.label, { color: "red" }]}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={ratingVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rate EatFitGo</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons
                    name={i <= rating ? "star" : "star-outline"}
                    size={30}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Any feedback?"
              style={styles.input}
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitRating}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.7,
    borderColor: "#ccc",
  },
  label: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#00c896",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
