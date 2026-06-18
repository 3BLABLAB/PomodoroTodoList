import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // 上部のヘッダーを非表示にする
        tabBarActiveTintColor: "#007aff", // タブがアクティブな時の色（青）
      }}
    >
      {/* 下部タブバーに表示する画面の定義 */}
      <Tabs.Screen
        name="index"
        options={{
          title: "タスク編集",
          // ここにアイコンの設定などを追加できます
        }}
      />
    </Tabs>
  );
}
