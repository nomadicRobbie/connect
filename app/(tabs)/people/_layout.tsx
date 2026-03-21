import { Stack } from "expo-router";

export default function PeopleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "People", headerLargeTitle: true }} />
      <Stack.Screen name="[roomId]" options={{ title: "Conversation" }} />
      <Stack.Screen name="new" options={{ title: "New Conversation", presentation: "modal" }} />
    </Stack>
  );
}
