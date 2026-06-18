import { Link } from "expo-router";
import React from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { useTodo } from "../contexts/TodoContext";

type CountdownTimerProps = {
  remainingTime: number;
  elapsedTime: number;
  color: string;
};

export default function RootIndex() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  //タイマーのリセットを制御するためのState（キーが変わるとタイマーが初期化される）
  const [timerKey, setTimerKey] = React.useState(0);
  // アプリが起動した瞬間、下部タブバー付きのホーム画面（(tabs)/index.tsx）へ自動で転送します
  //return <Redirect href="/(tabs)" />;
  const dummyTodos = [
    { id: "1", title: "基本構文の勉強", completed: false },
    { id: "2", title: "タイマーUIの実装", completed: false },
    { id: "3", title: "レポートの作成", completed: true },
  ];
  const { todos, currentTask, selectTask, deleteTodo } = useTodo();
  const taskDuration = (currentTask ? currentTask.duration : 25 * 60) || 1500; // タスクに設定された時間（秒）を使用、なければ25分（1500秒）

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 💡 3. 手動リセット回数とタスクのIDを組み合わせて一意のKeyを作る（タスク切り替え時に円が自動初期化される）
  const timerComponentKey = `${currentTask?.id || "default"}-${timerKey}`;

  const handleNextTask = () => {
    if (todos.length <= 1) {
      setIsPlaying(false);
      return;
    }

    const nextTask = todos[1];
    if (nextTask) {
      void selectTask(nextTask);
      setTimerKey((prev) => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* 0. ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>⏱️ ポモドーロタイマー</Text>
      </View>

      {/* 1. 現在のステータス・タスク表示領域 */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>🎯 現在の作業</Text>
        <Text style={styles.currentTaskText}>
          {currentTask?.title || "タスクが選択されていません"}
        </Text>
      </View>

      {/* 2. タイマー表示領域 */}
      <View style={styles.timerCircleWrapper}>
        <CountdownCircleTimer
          isPlaying={isPlaying}
          key={timerComponentKey}
          duration={taskDuration || 1500} // タスクに設定された時間（秒）を使用、なければ25分（1500秒）
          colors={["#3ac404", "#ffc30d", "#A30000"]}
          //残り何秒になったら色を変えるかの指定（上のcolorsの配列と対応させる）
          colorsTime={[
            Math.floor((taskDuration * 2) / 3),
            Math.floor((taskDuration * 1) / 3),
            0,
          ]}
          onComplete={() => {
            handleNextTask();
            deleteTodo(currentTask?.id || "");
            return { shouldRepeat: false, delay: 0 };
          }}
        >
          {(props: CountdownTimerProps) => (
            <Animated.Text
              style={{ ...styles.remainingTime, color: props.color }}
            >
              {formatTime(props.remainingTime)}
            </Animated.Text>
          )}
        </CountdownCircleTimer>
      </View>

      {/* 3. タイマー操作ボタン */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.startButton]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? "一時停止" : "スタート"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.resetButton]}
          onPress={() => {
            setIsPlaying(false);
            setTimerKey((prev) => prev + 1);
          }}
        >
          <Text style={styles.buttonText}>リセット</Text>
        </Pressable>
      </View>

      {/* 4. 【新機能】メイン画面下部のタスク一覧表示領域 (ScrollView) */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          📋 今日のタスク一覧（タップで変更）
        </Text>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {todos.length === 0 ? (
            <Text style={styles.emptyText}>
              タスクがありません。右下のボタンから追加してください。
            </Text>
          ) : (
            todos.map((todo) => (
              <Pressable
                key={todo.id}
                style={[
                  styles.todoItem,
                  currentTask?.title === todo.title && styles.activeTodoItem,
                ]}
                onPress={() => selectTask(todo)}
              >
                <Text
                  style={[
                    styles.todoText,
                    currentTask?.title === todo.title && styles.activeTodoText,
                  ]}
                >
                  {currentTask?.title === todo.title ? "🔥 " : "👉 "}{" "}
                  {todo.title}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {/* 5. 画面端の「＋」ボタン（ToDo編集画面へのリンク） */}
      <Link href="/(tabs)" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText} onPress={() => {}}>
            ➕
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    padding: 20,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#007aff",
  },
  appTitle: {
    paddingTop: 40,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1d1d1f",
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statusLabel: {
    fontSize: 14,
    color: "#86868b",
    fontWeight: "bold",
  },
  currentTaskText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1d1d1f",
    marginTop: 4,
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  timerText: {
    fontSize: 60,
    fontWeight: "200",
    color: "#1d1d1f",
    fontVariant: ["tabular-nums"], // 数字の幅を固定してチラつきを防ぐ
  },
  remainingTime: {
    fontSize: 36, //48,
    fontWeight: "bold",
    color: "#004777",
  },
  timerCircleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 2,
  },
  startButton: {
    backgroundColor: "#007aff",
  },
  stopButton: {
    backgroundColor: "#ff3b30",
  },
  resetButton: {
    backgroundColor: "#8e8e93",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listSection: {
    flex: 1, // 画面の下半分をいっぱいに使う
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d2d2d7",
    paddingTop: 20,
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#86868b",
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#8e8e93",
    marginTop: 20,
    fontSize: 14,
  },
  todoItem: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  activeTodoItem: {
    borderColor: "#007aff",
    backgroundColor: "#e3f2fd", // 現在選択中のタスクは背景を薄い青にする
  },
  todoText: {
    fontSize: 16,
    color: "#1d1d1f",
  },
  activeTodoText: {
    color: "#007aff",
    fontWeight: "bold",
  },
  todoTextCompleted: {
    textDecorationLine: "line-through",
    color: "#86868b",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#ff9500", // オレンジ色のアクセント
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "300",
  },
});
