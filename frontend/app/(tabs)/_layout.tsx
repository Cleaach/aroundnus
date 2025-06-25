import { Tabs } from "expo-router";
import { IconSymbol } from "../../components/ui/IconSymbol";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Navigation",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.fill" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
