import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  const [screenIndex, setScreenIndex] = useState(0);

  const screens = [
    {
      animation: require("../assets/loginpage.json"),
      title: "Welcome to EatFitGo",
      subtitle: "Get started on your journey to a healthier you!",
    },
    {
      animation: require("../assets/food.json"),
      title: "Crush Cravings Smartly",
      subtitle: "No stress, no guess - we've got your diet covered.",
    },
  ];

  const handleNext = () => {
    if (screenIndex < screens.length - 1) {
      setScreenIndex(screenIndex + 1);
    } else {
      navigation.navigate("Login");
    }
  };

  const handleBack = () => {
    if (screenIndex > 0) {
      setScreenIndex(screenIndex - 1);
    }
  };

  const isLast = screenIndex === screens.length - 1;

  return (
    <View style={styles.container}>
      <LottieView
        source={screens[screenIndex].animation}
        autoPlay
        loop
        style={styles.lottie}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>{screens[screenIndex].title}</Text>
        <Text style={styles.subtitle}>{screens[screenIndex].subtitle}</Text>

        <View style={styles.buttonContainer}>
          {screenIndex > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width,
    height: height * 0.8,
  },
  overlay: {
    paddingHorizontal: 30,
    width,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  backButton: {
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: "#00c896",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginLeft: "auto",
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
  },
});
