import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const IP_ADDRESS = "192.168.1.229"; 
  const API_URL = `http://${IP_ADDRESS}:8000/login`; 

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert("تنبيه", "يرجى إدخال البيانات المطلوبة");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        // التوجيه بناءً على المجلدات الجديدة التي قمتِ بإنشائها
        if (data.role === "Administrator" || data.role === "Admin") {
          router.replace('/admin/devices'); 
        } else {
          router.replace('/user/live');
        }
      } else {
        Alert.alert("فشل الدخول", data.detail || "بيانات غير صحيحة");
      }
    } catch (error) {
      Alert.alert("خطأ اتصال", "تأكد من تشغيل السيرفر وصحة الـ IP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.innerContainer}
      >
        <View style={styles.glassCard}>
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>S³</Text>
            </View>
            <Text style={styles.title}>SMART SURVEILLANCE</Text>
            <Text style={styles.subtitle}>& SAFETY SYSTEM LOGIN</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IDENTIFIER</Text>
            <TextInput 
              style={styles.input} 
              placeholder="admin@sys.com" 
              placeholderTextColor="#4b5563"
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>SECURITY KEY</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#4b5563"
              secureTextEntry 
              onChangeText={setPassword}
              value={password}
            />

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>AUTHENTICATE</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.versionText}>Luxor University - FCI © 2026</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#05070a', // خلفية داكنة ثابتة
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassCard: {
    width: Platform.OS === 'web' ? 420 : '100%',
    maxWidth: 450,
    backgroundColor: '#0d1117',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#30363d',
    // ظلال خفيفة لتعطي عمق (Shadow)
    shadowColor: '#00bcd4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoIcon: {
    width: 75,
    height: 75,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00bcd4',
  },
  logoLetter: {
    color: '#00bcd4',
    fontSize: 34,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    color: '#00bcd4',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 6,
    fontWeight: '700',
    opacity: 0.8,
  },
  inputGroup: {
    width: '100%',
  },
  label: {
    color: '#8b949e',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#161b22',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#30363d',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#00bcd4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00bcd4',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#005b66',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  footer: {
    marginTop: 35,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#21262d',
    paddingTop: 20,
  },
  versionText: {
    color: '#484f58',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  }
});