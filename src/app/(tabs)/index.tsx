import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTodo } from "../../contexts/TodoContext";

export default function TodoTabsScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [inputTaskDuration, setInputTaskDuration] = useState("25");
  const [inputBreakDuration, setInputBreakDuration] = useState("10");
  const [breakCount, setBreakCount] = useState(0);

  // 💡Contextから共有データと操作用の関数をまとめて取得
  const {
    todos,
    addTodo,
    deleteTodo,
    toggleTodo,
    selectTask,
    moveTodoUp,
    moveTodoDown,
  } = useTodo();

  const handleAdd = () => {
    if (inputText.trim() === "") return;
    const minutes = parseInt(inputTaskDuration, 10);
    if (isNaN(minutes) || minutes <= 0) return; // 不正な数値をガード

    addTodo(inputText, minutes);
    setInputText("");
    setInputTaskDuration("1"); // リセット
  };

  const breakAdd = () => {
    const minutes = parseInt(inputBreakDuration, 10);
    if (isNaN(minutes) || minutes <= 0) return; // 不正な数値をガード

    addTodo("休憩" + (breakCount + 1), minutes);
    setInputBreakDuration("1"); // リセット
    setBreakCount(breakCount + 1);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </Pressable>
        <Text style={styles.headerTitle}>📝 タスク一言管理</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.sectionLabel}>📌 新しいタスク</Text>
        <TextInput
          style={styles.inputTask}
          placeholder="新しいタスクを入力..."
          placeholderTextColor="#8e8e93"
          value={inputText}
          onChangeText={setInputText}
        />
        <View style={styles.durationInputWrapper}>
          <TextInput
            style={styles.inputDuration}
            keyboardType="number-pad"
            maxLength={3}
            value={inputTaskDuration}
            placeholder={inputTaskDuration || "0"}
            onChangeText={setInputTaskDuration}
          />
          <Text style={styles.minuteLabel}>分</Text>
        </View>
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>追加</Text>
        </Pressable>
      </View>

      <View style={styles.breakTimeContainer}>
        <Text style={styles.sectionLabel}>☕ 休憩時間設定</Text>
        <View style={styles.breakTimeWrapper}>
          <TextInput
            style={styles.breakTimeInput}
            placeholder="休憩時間を入力..."
            placeholderTextColor="#8e8e93"
            keyboardType="number-pad"
            maxLength={3}
            value={inputBreakDuration}
            onChangeText={setInputBreakDuration}
          />
          <Text style={styles.minuteLabel}>分</Text>
        </View>
        <Pressable style={styles.confirmButton} onPress={breakAdd}>
          <Text style={styles.confirmButtonText}>確定</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.listContainer}>
        {todos.map((todo) => (
          <View key={todo.id} style={styles.todoItem}>
            <Pressable
              style={styles.todoLeft}
              onPress={() => {
                selectTask(todo);
                router.back();
              }}
            >
              <Text style={styles.todoText}>
                👉 {todo.title} ({todo.duration ? todo.duration / 60 : 0}分)
              </Text>
            </Pressable>
            <View style={styles.todoActions}>
              <Pressable
                style={styles.moveButton}
                onPress={() => moveTodoUp(todo.id)}
              >
                <Text style={styles.moveButtonText}>↑</Text>
              </Pressable>
              <Pressable
                style={styles.moveButton}
                onPress={() => moveTodoDown(todo.id)}
              >
                <Text style={styles.moveButtonText}>↓</Text>
              </Pressable>
              <Pressable
                style={styles.deleteButton}
                onPress={() => deleteTodo(todo.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#d2d2d7",
  },
  backButton: { paddingVertical: 6 },
  backButtonText: { color: "#007aff", fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1d1d1f" },
  inputContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5ea",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1d1d1f",
    marginBottom: 12,
  },
  inputTask: {
    backgroundColor: "#f5f5f7",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 15,
    color: "#1d1d1f",
    marginBottom: 12,
  },
  durationInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputDuration: {
    backgroundColor: "#f5f5f7",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 15,
    color: "#1d1d1f",
    textAlign: "center",
    flex: 1,
    marginRight: 8,
  },
  minuteLabel: { fontSize: 14, color: "#1d1d1f", fontWeight: "500" },
  addButton: {
    backgroundColor: "#007aff",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  breakTimeContainer: {
    padding: 16,
    backgroundColor: "#fff8dc",
    borderLeftWidth: 4,
    borderLeftColor: "#ff9500",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  breakTimeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  breakTimeInput: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 15,
    color: "#1d1d1f",
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ff9500",
  },
  confirmButton: {
    backgroundColor: "#ff9500",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  listContainer: { flex: 1, padding: 16 },
  todoItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
  },
  todoLeft: { flex: 1, paddingVertical: 4 },
  todoText: { fontSize: 16, color: "#1d1d1f" },
  todoActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  moveButton: {
    backgroundColor: "#f0f0f5",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  moveButtonText: {
    fontSize: 16,
    color: "#1d1d1f",
    fontWeight: "600",
  },
  deleteButton: { padding: 4 },
  deleteButtonText: { fontSize: 18 },
});
