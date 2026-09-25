import { Stack } from "expo-router";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { TodoProvider } from "../contexts/TodoContext";

export default function RootLayout() {
  return (
    <TodoProvider>
      <SafeAreaView style={styles.container}>
        {/* メインコンテンツ */}
        <View style={styles.mainContent}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ presentation: "modal" }} />
          </Stack>
        </View>
      </SafeAreaView>
    </TodoProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  mainContent: {
    flex: 1,
  },
});
