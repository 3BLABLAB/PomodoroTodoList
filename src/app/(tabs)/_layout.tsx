import { Stack } from "expo-router";
import React from "react";

// タブは1画面しかなく、タブバーを表示する意味がないため
// 通常のStackとして扱い、無用なタブバーは出さない
export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
