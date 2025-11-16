import { Stack } from "expo-router";

export default function RoutineLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="crear" />
      <Stack.Screen name="editar" />
      <Stack.Screen name="detalle" />
    </Stack>
  );
}
