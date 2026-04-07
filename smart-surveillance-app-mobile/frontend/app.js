import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // IP السيرفر (اللابتوب) بناءً على البيئة الحالية
  const IP = "192.168.1.229"; 

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("تنبيه", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      // تطبيق متطلب التشفير المذكور في البحث (Security Requirements) [cite: 2448]
      const response = await fetch(`http://${IP}:8000/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // التحقق من الأدوار (RBAC) كما هو موضح في التصميم (Admin vs User) [cite: 2427, 2451]
        console.log("Role Assigned:", data.role);
        
        // إذا كان أدمن يروح للوحة التحكم، لو يوزر يروح لشاشة المراقبة فقط [cite: 3103, 3141]
        if (data.role === 'admin' || email.includes('admin')) {
          router.replace('/(admin)/devices'); 
        } else {
          router.replace('/(user)/live'); 
        }
      } else {
        Alert.alert("فشل تسجيل الدخول", data.detail || "بيانات الاعتماد غير صحيحة");
      }
    } catch (error) {
      Alert.alert("خطأ في الاتصال", "تأكد من تشغيل Backend على: " + IP);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* أيقونة الدرع الموجودة في تصميم Mockup  */}
      <View style={styles.logoContainer}>
        <View style={styles.shieldIcon}>
            <Text style={{color: '#00bcd4', fontSize: 40}}>🛡️</Text>
        </View>
        <Text style={styles.title}>Smart</Text>
        <Text style={styles.subtitle}>Surveillance System</Text>
      </View>
      
      <View style={styles.form}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput 
          style={styles.input} 
          placeholder="admin@sys.com" 
          placeholderTextColor="#4b5563"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry 
          placeholder="••••••••"
          placeholderTextColor="#4b5563"
          onChangeText={setPassword}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && { backgroundColor: '#0e3a40' }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* إضافة خيار نسيت كلمة المرور كما في المتطلبات [cite: 2429] */}
        <TouchableOpacity style={{marginTop: 15}}>
            <Text style={{color: '#4b5563', textAlign: 'center', fontSize: 12}}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.version}>Luxor University • FCI 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c10', justifyContent: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 60 },
  shieldIcon: { 
    width: 80, 
    height: 80, 
    backgroundColor: 'rgba(0, 188, 212, 0.1)', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00bcd4'
  },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#fff', fontWeight: '500' },
  form: { width: '100%' },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: '600' },
  input: { 
    backgroundColor: '#161b22', 
    color: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#30363d' 
  },
  button: { 
    backgroundColor: '#00bcd4', 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  version: { color: '#4b5563', textAlign: 'center', marginTop: 60, fontSize: 10 }
});