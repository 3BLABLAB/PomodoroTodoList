import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Todo, useTodo } from "../../contexts/TodoContext";

type HistoryGroup = {
  dateKey: string;
  label: string;
  tasks: Todo[];
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const formatDateLabel = (date: Date) =>
  `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAY_LABELS[date.getDay()]}）`;

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 完了済みの作業タスク（休憩を除く）を完了日ごとにグルーピングし、新しい日付順に並べる
const buildHistoryGroups = (todos: Todo[]): HistoryGroup[] => {
  const groups = new Map<string, HistoryGroup>();

  todos
    .filter(
      (todo) => todo.type === "work" && todo.completed && todo.completedAt,
    )
    .forEach((todo) => {
      const date = new Date(todo.completedAt as number);
      const dateKey = formatDateKey(date);
      const existing = groups.get(dateKey);
      if (existing) {
        existing.tasks.push(todo);
      } else {
        groups.set(dateKey, {
          dateKey,
          label: formatDateLabel(date),
          tasks: [todo],
        });
      }
    });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      tasks: [...group.tasks].sort(
        (a, b) => (b.completedAt as number) - (a.completedAt as number),
      ),
    }))
    .sort(
      (a, b) =>
        (b.tasks[0].completedAt as number) - (a.tasks[0].completedAt as number),
    );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { todos, addSampleHistoryData } = useTodo();
  const historyGroups = buildHistoryGroups(todos);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>✕ 閉じる</Text>
        </Pressable>
        <Text style={styles.headerTitle}>📅 達成履歴</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {historyGroups.length === 0 ? (
          <View>
            <Text style={styles.emptyText}>
              まだ完了したタスクがありません。
            </Text>
            <Pressable
              style={styles.seedButton}
              onPress={() => void addSampleHistoryData()}
            >
              <Text style={styles.seedButtonText}>
                テスト用のサンプルデータを追加
              </Text>
            </Pressable>
          </View>
        ) : (
          historyGroups.map((group) => (
            <View key={group.dateKey} style={styles.dateSection}>
              <View style={styles.dateHeaderRow}>
                <Text style={styles.dateLabel}>{group.label}</Text>
                <Text style={styles.dateCount}>
                  {group.tasks.length}件達成
                </Text>
              </View>
              {group.tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <Text style={styles.taskTime}>
                    {formatTime(task.completedAt as number)}
                  </Text>
                  <Text style={styles.taskTitle}>✅ {task.title}</Text>
                  <Text style={styles.taskDuration}>
                    {task.duration ? Math.round(task.duration / 60) : 0}分
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#d2d2d7",
  },
  backButton: { paddingVertical: 6 },
  backButtonText: { color: "#007aff", fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1d1d1f" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyText: {
    textAlign: "center",
    color: "#8e8e93",
    marginTop: 40,
    fontSize: 14,
    marginBottom: 20,
  },
  seedButton: {
    alignSelf: "center",
    backgroundColor: "#007aff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  seedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dateSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5ea",
    paddingBottom: 8,
  },
  dateLabel: { fontSize: 16, fontWeight: "bold", color: "#1d1d1f" },
  dateCount: { fontSize: 13, color: "#86868b", fontWeight: "600" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  taskTime: {
    fontSize: 13,
    color: "#86868b",
    width: 48,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    color: "#1d1d1f",
  },
  taskDuration: {
    fontSize: 13,
    color: "#86868b",
  },
});
