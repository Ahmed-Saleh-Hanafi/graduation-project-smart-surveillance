import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Login",
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: "Monitor",
          tabBarStyle: { display: "flex" }, 
        }}
      />
    </Tabs>
  );
}
