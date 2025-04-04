import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

import API from "../utils/api";
import {
  GOOGLE_CLIENT_ID,
  ANDROID_CLIENT_ID,
  IOS_CLIENT_ID,
} from "../utils/authConfig";

WebBrowser.maybeCompleteAuthSession();

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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Google auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
  });

  // Google login success handler
  useEffect(() => {
    if (response?.type === "success") {
      const accessToken = response.authentication.accessToken;
      fetchGoogleUser(accessToken);
    }
  }, [response]);

  const fetchGoogleUser = async (token) => {
    try {
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      const payload = {
        email: user.email,
        firstName: user.given_name,
        lastName: user.family_name || "",
        socialId: user.id,
        provider: "google",
      };
      const result = await API.post("/auth/social-login", payload);
      await AsyncStorage.setItem("token", result.data.token);
      console.log("Token saved after Google login:", result.data.token);

      Alert.alert("Google Login", "Success");
      navigation.replace("ProfileSetup");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Google login failed");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Email and password are required");
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });

      const token = res.data.token;
      if (token) {
        await AsyncStorage.setItem("token", token);
        await syncLocalStepsToBackend();
        console.log("Token saved");
      }

      // Now fetch user to check profileCompleted
      const userRes = await API.get("/user/me");
      const profileCompleted = userRes.data.profileCompleted;

      setLoading(false);
      Alert.alert("Success", res.data.message);

      if (profileCompleted) {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "ProfileSetup" }],
        });
      }
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Login failed";
      console.log("Login error:", msg, err);
      Alert.alert("Error", msg);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const payload = {
        email: credential.email,
        firstName: credential.fullName?.givenName || "",
        lastName: credential.fullName?.familyName || "",
        socialId: credential.user,
        provider: "apple",
      };

      const result = await API.post("/auth/social-login", payload);
      await AsyncStorage.setItem("token", result.data.token);
      console.log("Token saved after Apple login:", result.data.token);

      Alert.alert("Apple Login", "Success");
      navigation.replace("ProfileSetup");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Apple login failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to EatFitGo</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={() => Alert.alert("Forgot Password")}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.socialButton, { backgroundColor: "#DB4437" }]}
        onPress={() => promptAsync()}
      >
        <Text style={styles.socialText}>Continue with Google</Text>
      </TouchableOpacity>

      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={{ width: "100%", height: 50, marginTop: 10 }}
          onPress={handleAppleLogin}
        />
      )}

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
        style={[styles.skipButton, { marginTop: 20 }]}
        onPress={() => navigation.navigate("PedometerTest")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>
          Skip & Test Pedometer
        </Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
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
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: "#eee",
  },
  socialButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  socialText: {
    color: "#fff",
    fontWeight: "bold",
  },
  link: {
    textAlign: "center",
    color: "#007AFF",
    marginTop: 15,
  },
  skipButton: {
    alignItems: "center",
    marginTop: 10,
  },
});
