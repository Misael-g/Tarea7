import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { colors } from "@/src/styles/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { esEntrenador } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="planes"
        options={{
          title: "Planes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />

      {!esEntrenador && (
        <Tabs.Screen
          name="progreso"
          options={{
            title: "Progreso",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />

      {/* Ocultar la pantalla mis-rutinas pero mantenerla en el código */}
      <Tabs.Screen
        name="mis-rutinas"
        options={{
          href: null, // Esto oculta la pestaña
        }}
      />
    </Tabs>
  );
}