import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Todo, useTodo } from "../../contexts/TodoContext";

const TASK_PRESETS = [5, 15, 25, 45];
const BREAK_PRESETS = [5, 10, 15];
const ROW_HEIGHT = 72;

export default function TodoTabsScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [inputTaskDuration, setInputTaskDuration] = useState("25");
  const [inputBreakDuration, setInputBreakDuration] = useState("10");

  // インライン編集用の状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");

  // ドラッグ&ドロップ並べ替え用の状態
  const [displayTodos, setDisplayTodos] = useState<Todo[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragStartIndexRef = useRef(0);
  const dragCurrentIndexRef = useRef(0);
  const displayTodosRef = useRef<Todo[]>([]);

  // 💡Contextから共有データと操作用の関数をまとめて取得
  const {
    todos,
    addTodo,
    editTodo,
    deleteTodo,
    selectTask,
    moveTodoUp,
    moveTodoDown,
    reorderTodos,
    settings,
    updateSettings,
  } = useTodo();

  // ドラッグ中でなければ、Contextの最新のtodosを表示用リストへ反映する
  useEffect(() => {
    if (draggingId === null) {
      setDisplayTodos(todos);
      displayTodosRef.current = todos;
    }
  }, [todos, draggingId]);

  const handleAdd = () => {
    if (inputText.trim() === "") return;
    const minutes = parseInt(inputTaskDuration, 10);
    if (isNaN(minutes) || minutes <= 0) return; // 不正な数値をガード

    addTodo(inputText, minutes);
    setInputText("");
    // 分数はそのまま保持し、連続追加しやすくする（毎回入力し直さなくてよい）
  };

  const breakAdd = () => {
    const minutes = parseInt(inputBreakDuration, 10);
    if (isNaN(minutes) || minutes <= 0) return; // 不正な数値をガード

    void addTodo("休憩", minutes, "break");
    // 分数はそのまま保持する
  };

  const handleDeleteConfirm = (todo: Todo) => {
    Alert.alert(
      "削除の確認",
      `「${todo.title}」を削除します。よろしいですか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => void deleteTodo(todo.id),
        },
      ],
    );
  };

  const startEdit = (todo: Todo) => {
    if (draggingId) return;
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDuration(todo.duration ? String(Math.round(todo.duration / 60)) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDuration("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (editTitle.trim() === "") return;
    const minutes = parseInt(editDuration, 10);
    await editTodo(editingId, {
      title: editTitle.trim(),
      ...(isNaN(minutes) || minutes <= 0 ? {} : { duration: minutes }),
    });
    cancelEdit();
  };

  // ドラッグ操作中の1行分のPanResponderを生成する
  const createPanResponder = (todo: Todo, index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => editingId === null,
      onMoveShouldSetPanResponder: () => editingId === null,
      onPanResponderGrant: () => {
        dragStartIndexRef.current = index;
        dragCurrentIndexRef.current = index;
        dragTranslateY.setValue(0);
        setDraggingId(todo.id);
      },
      onPanResponderMove: (_evt, gestureState) => {
        const shift = Math.round(gestureState.dy / ROW_HEIGHT);
        const list = displayTodosRef.current;
        const newIndex = Math.min(
          Math.max(dragStartIndexRef.current + shift, 0),
          list.length - 1,
        );

        if (newIndex !== dragCurrentIndexRef.current) {
          const reordered = [...list];
          const fromIndex = reordered.findIndex((t) => t.id === todo.id);
          const [moved] = reordered.splice(fromIndex, 1);
          reordered.splice(newIndex, 0, moved);
          displayTodosRef.current = reordered;
          setDisplayTodos(reordered);
          dragCurrentIndexRef.current = newIndex;
        }

        const compensatedOffset =
          gestureState.dy -
          (dragCurrentIndexRef.current - dragStartIndexRef.current) *
            ROW_HEIGHT;
        dragTranslateY.setValue(compensatedOffset);
      },
      onPanResponderRelease: () => {
        dragTranslateY.setValue(0);
        setDraggingId(null);
        void reorderTodos(displayTodosRef.current);
      },
      onPanResponderTerminate: () => {
        dragTranslateY.setValue(0);
        setDraggingId(null);
        setDisplayTodos(todos);
        displayTodosRef.current = todos;
      },
    });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>✕ 閉じる</Text>
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
        <View style={styles.presetRow}>
          {TASK_PRESETS.map((minutes) => (
            <Pressable
              key={minutes}
              style={[
                styles.presetChip,
                inputTaskDuration === String(minutes) &&
                  styles.presetChipActive,
              ]}
              onPress={() => setInputTaskDuration(String(minutes))}
            >
              <Text
                style={[
                  styles.presetChipText,
                  inputTaskDuration === String(minutes) &&
                    styles.presetChipTextActive,
                ]}
              >
                {minutes}分
              </Text>
            </Pressable>
          ))}
        </View>
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
        <View style={styles.presetRow}>
          {BREAK_PRESETS.map((minutes) => (
            <Pressable
              key={minutes}
              style={[
                styles.presetChip,
                styles.breakPresetChip,
                inputBreakDuration === String(minutes) &&
                  styles.breakPresetChipActive,
              ]}
              onPress={() => setInputBreakDuration(String(minutes))}
            >
              <Text
                style={[
                  styles.presetChipText,
                  inputBreakDuration === String(minutes) &&
                    styles.presetChipTextActive,
                ]}
              >
                {minutes}分
              </Text>
            </Pressable>
          ))}
        </View>
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
          <Text style={styles.confirmButtonText}>休憩を追加</Text>
        </Pressable>

        <View style={styles.autoBreakRow}>
          <Text style={styles.autoBreakLabel}>
            タスク追加時に自動で休憩を挿入する
          </Text>
          <Switch
            value={settings.autoBreakEnabled}
            onValueChange={(value) =>
              void updateSettings({ autoBreakEnabled: value })
            }
          />
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        scrollEnabled={draggingId === null}
      >
        {displayTodos.map((todo, index) => {
          const isEditing = editingId === todo.id;
          const isDragging = draggingId === todo.id;
          const panResponder = createPanResponder(todo, index);

          if (isEditing) {
            return (
              <View
                key={todo.id}
                style={[styles.todoItem, styles.todoItemEditing]}
              >
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.editTitleInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="タスク名"
                  />
                  <View style={styles.editDurationRow}>
                    <TextInput
                      style={styles.editDurationInput}
                      value={editDuration}
                      onChangeText={setEditDuration}
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholder="分"
                    />
                    <Text style={styles.minuteLabel}>分</Text>
                  </View>
                  <View style={styles.editActionsRow}>
                    <Pressable
                      style={[styles.editActionButton, styles.editSaveButton]}
                      onPress={saveEdit}
                    >
                      <Text style={styles.editActionText}>保存</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.editActionButton,
                        styles.editCancelButton,
                      ]}
                      onPress={cancelEdit}
                    >
                      <Text style={styles.editActionText}>キャンセル</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          return (
            <Animated.View
              key={todo.id}
              style={[
                styles.todoItem,
                todo.type === "break" && styles.breakTodoItem,
                todo.completed && styles.completedTodoItem,
                isDragging && {
                  transform: [{ translateY: dragTranslateY }],
                  zIndex: 10,
                  elevation: 6,
                  shadowOpacity: 0.3,
                },
              ]}
            >
              <View
                style={styles.dragHandle}
                {...panResponder.panHandlers}
                accessibilityLabel="ドラッグして並べ替え"
              >
                <Text style={styles.dragHandleText}>≡</Text>
              </View>
              <Pressable
                style={styles.todoLeft}
                onPress={() => {
                  selectTask(todo);
                  router.back();
                }}
                onLongPress={() => startEdit(todo)}
              >
                <Text
                  style={[
                    styles.todoText,
                    todo.completed && styles.todoTextCompleted,
                  ]}
                >
                  {todo.type === "break" ? "☕ " : "👉 "}
                  {todo.title} ({todo.duration ? todo.duration / 60 : 0}分)
                </Text>
              </Pressable>
              <View style={styles.todoActions}>
                <Pressable
                  style={styles.moveButton}
                  onPress={() => startEdit(todo)}
                  accessibilityLabel="編集"
                >
                  <Text style={styles.moveButtonText}>✏️</Text>
                </Pressable>
                <Pressable
                  style={styles.moveButton}
                  onPress={() => moveTodoUp(todo.id)}
                  accessibilityLabel="上に移動"
                >
                  <Text style={styles.moveButtonText}>↑</Text>
                </Pressable>
                <Pressable
                  style={styles.moveButton}
                  onPress={() => moveTodoDown(todo.id)}
                  accessibilityLabel="下に移動"
                >
                  <Text style={styles.moveButtonText}>↓</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteConfirm(todo)}
                  accessibilityLabel="削除"
                  hitSlop={8}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </Pressable>
              </View>
            </Animated.View>
          );
        })}
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
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: "#f0f0f5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  presetChipActive: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },
  breakPresetChip: {
    borderColor: "#ffdca3",
  },
  breakPresetChipActive: {
    backgroundColor: "#ff9500",
    borderColor: "#ff9500",
  },
  presetChipText: {
    fontSize: 13,
    color: "#1d1d1f",
    fontWeight: "600",
  },
  presetChipTextActive: {
    color: "#fff",
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
  autoBreakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  autoBreakLabel: {
    fontSize: 13,
    color: "#1d1d1f",
    flex: 1,
    marginRight: 8,
  },
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
    minHeight: ROW_HEIGHT,
  },
  breakTodoItem: {
    backgroundColor: "#fff8dc",
    borderWidth: 1,
    borderColor: "#ffe0a3",
  },
  completedTodoItem: {
    opacity: 0.6,
  },
  todoItemEditing: {
    alignItems: "stretch",
  },
  editForm: {
    flex: 1,
  },
  editTitleInput: {
    backgroundColor: "#f5f5f7",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 10,
  },
  editDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  editDurationInput: {
    backgroundColor: "#f5f5f7",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 15,
    width: 70,
    textAlign: "center",
    marginRight: 8,
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editSaveButton: {
    backgroundColor: "#007aff",
  },
  editCancelButton: {
    backgroundColor: "#8e8e93",
  },
  editActionText: {
    color: "#fff",
    fontWeight: "600",
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginRight: 4,
  },
  dragHandleText: {
    fontSize: 20,
    color: "#c7c7cc",
    fontWeight: "700",
  },
  todoLeft: { flex: 1, paddingVertical: 4 },
  todoText: { fontSize: 16, color: "#1d1d1f" },
  todoTextCompleted: {
    textDecorationLine: "line-through",
    color: "#86868b",
  },
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
