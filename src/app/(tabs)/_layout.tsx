import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F766E",
        tabBarStyle: { backgroundColor: "#FFFFFF" },
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name={icon as "search-outline"}
                size={size}
                color={typeof color === "string" ? color : "#0F766E"}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
