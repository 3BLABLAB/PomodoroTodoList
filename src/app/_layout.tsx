import { Stack } from "expo-router";
import { TodoProvider } from "../contexts/TodoContext"; // 💡インポート

export default function RootLayout() {
  return (
    // 💡アプリ全体をデータ配信の箱で包み込む
    <TodoProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </TodoProvider>
  );
}
