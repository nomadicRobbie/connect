import { Stack } from "expo-router";

export default function AssetsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Assets", headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ title: "Asset Detail" }} />
      <Stack.Screen name="form/new" options={{ title: "New Asset" }} />
      <Stack.Screen name="form/[id]" options={{ title: "Edit Asset" }} />
      <Stack.Screen name="maintenance/new" options={{ title: "New Maintenance Record" }} />
      <Stack.Screen name="maintenance/[id]" options={{ title: "Edit Maintenance Record" }} />
    </Stack>
  );
}
