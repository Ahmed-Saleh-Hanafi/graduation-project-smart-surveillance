import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import axios from "axios"; 
import { Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";

const { width, height } = Dimensions.get("window");
export default function App() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const API_URL = "http://localhost:5198/api/Account/login";
      const response = await axios.post(API_URL, {
        email: email,
        password: password,
      });

      if (response.data.isSuccess) {
        const token = response.data.data.token;
        await AsyncStorage.setItem('userToken', token);
        console.log("Login Success! Token Saved.");
        router.replace("/(tabs)/live");     
      }
    } catch (error) {
      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        Alert.alert("Fail", error.response.data.message || "Invalid Data");
      } else {
        console.log("Network Error:", error.message);
        Alert.alert("Network Error", "Please try again");
      }
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header with logo */}
          <View style={styles.headerSection}>
            <Image
              source={require("../../assets/images/logo3.jpeg")}
              style={styles.logoImage}
              resizeMode="stretch" 
            />
          </View>

          <View style={styles.contentSection}>
            <View style={styles.loginCard}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              {/* ✅ Fixed: subtitle now shows */}
              <Text style={styles.welcomeSub}>Please sign in to continue</Text>

              <Text style={styles.inputLabel}>SYSTEM ID / EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@gmail.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

                            {/* ✅ Fixed: PASSWORD label without forgot password (matches screenshot) */}
              <Text style={[styles.inputLabel, { marginTop: 20 }]}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.textInput}
                  placeholder="········"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                {/* ✅ زرار إظهار/إخفاء الباسوورد */}
               
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.signInBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={["rgb(0, 110, 255)", "rgb(0, 110, 255)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.signInBtnText}>SIGN IN</Text>
                      <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ✅ Fixed: Footer with shield icon above text */}
            <View style={styles.footerSection}>
              <Ionicons name="shield-checkmark-outline" size={28} color="rgb(0, 110, 255)" style={{ marginBottom: 8 }} />
              <Text style={styles.footerText}>Secure Monitoring Platform</Text>
              <Text style={styles.footerSubText}>
                Powered by <Text style={{ fontWeight: 'bold', color: "#3d4753be" }}>Camguard System</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", 
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerSection: {
    width: width,
    height: height * 0.4,
    backgroundColor: "#ffffff", 
  },
  logoImage: {
    width: "100%",
    height: "80%",
  },
  contentSection: {
    paddingHorizontal: 25,
    marginTop: -90,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 30,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    color: "#1E293B",
  },
  // ✅ Fixed: subtitle style
  welcomeSub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 35,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: "#F8FAFC",
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  signInBtn: {
    marginTop: 35,
    borderRadius: 15,
    overflow: "hidden",
  },
  gradientBtn: {
    flexDirection: "row",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 10,
    letterSpacing: 1.5,
  },
  // ✅ Fixed: footer centered with icon space
  footerSection: {
    alignItems: "center",
    paddingVertical: 25,
  },
  footerText: {
    color: "rgba(47, 45, 45, 0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  footerSubText: {
    color: "rgba(7, 7, 7, 0.4)",
    fontSize: 12,
    marginTop: 4,
  },
});