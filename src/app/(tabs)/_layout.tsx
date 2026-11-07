import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F766E",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E6EEE8" },
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
      }}
    >
      {[
        ["index", "Explorar", "search-outline"],
        ["add", "Adicionar", "add-circle-outline"],
        ["profile", "Perfil", "person-outline"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 48,
                  height: 32,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? "#E3F3E9" : "transparent",
                }}
              >
                <Ionicons
                  name={icon as "search-outline"}
                  size={size}
                  color={typeof color === "string" ? color : "#0F766E"}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
