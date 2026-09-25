import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import Constants from "expo-constants";
import * as KeepAwake from "expo-keep-awake";
import * as Notifications from "expo-notifications";
import { Link } from "expo-router";
import React from "react";
import {
  Animated,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { Todo, useTodo } from "../contexts/TodoContext";

const KEEP_AWAKE_TAG = "pomodoro-timer";
// Expo Goにはカスタム通知音がネイティブ組み込みされていないため、Expo Go実行時はデフォルト音にフォールバックする
const IS_EXPO_GO = Constants.appOwnership === "expo";
// Androidでスリープ中/ロック画面でも通知が確実に見えるようにするための専用チャンネル
const TIMER_CHANNEL_ID = "timer-complete";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // アプリ起動中にも、画面に通知メッセージを表示する
    shouldPlaySound: true, // 通知が届いたときに、スマホの通知音を鳴らす
    shouldSetBadge: false, // アプリアイコンの右上に「1」などの赤丸バッジをつけない
    shouldShowBanner: true, // 画面上部にバナーとして表示する
    shouldShowList: true, // 通知センターの履歴リストに残す
  }),
});

type CountdownTimerProps = {
  remainingTime: number;
  elapsedTime: number;
  color: string;
};

export default function RootIndex() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  //タイマーのリセットを制御するためのState（キーが変わるとタイマーが初期化される）
  const [timerKey, setTimerKey] = React.useState(0);
  // 再生位置の巻き戻しだけで繰り返し鳴らせるよう、プレイヤーは使い回す
  const soundPlayer = useAudioPlayer(
    require("../../assets/sounds/timer_complete.wav"),
  );
  // バックグラウンド復帰時にタイマーがずれないよう、終了予定時刻を保持する
  const endTimeRef = React.useRef<number | null>(null);
  // 現在スケジュール済みの通知ID（個別キャンセルのために保持）
  const notificationIdRef = React.useRef<string | null>(null);

  const { todos, currentTask, toggleTodo, selectTask } = useTodo();
  const taskDuration = (currentTask ? currentTask.duration : 25 * 60) || 1500; // タスクに設定された時間（秒）を使用、なければ25分（1500秒）
  const remainingTimeRef = React.useRef(taskDuration);
  // タイマーに実際に渡す残り秒数（バックグラウンド復帰時の再計算や延長で変わる）
  const [activeDuration, setActiveDuration] = React.useState(taskDuration);
  // タスクが切り替わった（またはタスクの時間が編集された）ことを検知するためのキー
  const [syncedTaskKey, setSyncedTaskKey] = React.useState(
    `${currentTask?.id}-${taskDuration}`,
  );
  const taskKey = `${currentTask?.id}-${taskDuration}`;
  if (taskKey !== syncedTaskKey) {
    // タスクが切り替わったら、タイマー表示をリセットする
    setSyncedTaskKey(taskKey);
    setActiveDuration(taskDuration);
  }
  // refの更新はレンダー中に行えないためeffectで行う
  React.useEffect(() => {
    remainingTimeRef.current = taskDuration;
  }, [taskKey, taskDuration]);

  // 初回起動時の通知許可リクエストと、ロック画面表示のためのAndroid通知チャンネル設定
  React.useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    };
    void requestPermissions();

    if (Platform.OS === "android") {
      void Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
        name: "タイマー終了通知",
        importance: Notifications.AndroidImportance.HIGH,
        // ロック画面・スリープ中でも通知内容がそのまま表示されるようにする
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }, []);

  // タイマー再生中は画面をスリープさせない
  React.useEffect(() => {
    if (isPlaying) {
      KeepAwake.activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } else {
      KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG);
    }
    return () => {
      KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [isPlaying]);

  // タイマー状態に応じた通知のスケジュール管理（自分がスケジュールした通知だけを個別キャンセルする）
  React.useEffect(() => {
    const manageNotifications = async () => {
      if (notificationIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(
          notificationIdRef.current,
        );
        notificationIdRef.current = null;
      }
      if (isPlaying) {
        const seconds = remainingTimeRef.current;
        if (seconds > 0) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: "ポモドーロタイマー",
              body: `${currentTask?.title || "タスク"}の時間が終了しました！`,
              sound: IS_EXPO_GO ? true : "timer_complete.wav",
              ...(Platform.OS === "android"
                ? { channelId: TIMER_CHANNEL_ID }
                : null),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: seconds,
            },
          });
          notificationIdRef.current = id;
        }
      }
    };
    void manageNotifications();
  }, [isPlaying, currentTask, activeDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // マナーモードのiOSでも終了音が鳴るようにする
  React.useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
      console.warn("オーディオモードの設定に失敗しました", error);
    });
  }, []);

  const playCompletionSound = React.useCallback(async () => {
    try {
      // expo-audioは再生終了後も位置が末尾のままなので、毎回先頭へ戻す
      await soundPlayer.seekTo(0);
      soundPlayer.play();
    } catch (error) {
      console.warn("サウンド再生に失敗しました", error);
    }
  }, [soundPlayer]);

  // 💡 手動リセット回数とタスクのIDを組み合わせて一意のKeyを作る（タスク切り替え時に円が自動初期化される）
  const timerComponentKey = `${currentTask?.id || "default"}-${timerKey}`;

  // タスク完了処理（削除はせず完了済みとして記録し、次の未完了タスクへ自動的に進む）
  const completeCurrentTask = React.useCallback(
    async (finishedTaskId: string | undefined) => {
      void playCompletionSound();
      if (finishedTaskId) {
        await toggleTodo(finishedTaskId);
      }
      const hasNext = todos.some(
        (todo) => !todo.completed && todo.id !== finishedTaskId,
      );
      if (!hasNext) {
        setIsPlaying(false);
      }
    },
    [todos, toggleTodo, playCompletionSound],
  );

  // バックグラウンド／ロック中もタイマーのズレを防ぐため、復帰時に残り時間を再計算する
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      if (!isPlaying || endTimeRef.current == null) return;

      const remainingMs = endTimeRef.current - Date.now();
      const newRemaining = Math.max(0, Math.round(remainingMs / 1000));

      if (newRemaining <= 0) {
        endTimeRef.current = null;
        remainingTimeRef.current = 0;
        void completeCurrentTask(currentTask?.id);
        setTimerKey((prev) => prev + 1);
      } else {
        remainingTimeRef.current = newRemaining;
        setActiveDuration(newRemaining);
        setTimerKey((prev) => prev + 1);
      }
    });

    return () => subscription.remove();
  }, [isPlaying, currentTask?.id, completeCurrentTask]);

  const handleStartPause = () => {
    if (!isPlaying) {
      endTimeRef.current = Date.now() + remainingTimeRef.current * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    endTimeRef.current = null;
    remainingTimeRef.current = taskDuration;
    setActiveDuration(taskDuration);
    setTimerKey((prev) => prev + 1);
  };

  // 現在のタスクを完了扱いにせず、次の未完了タスクへスキップする
  const handleSkip = () => {
    const nextIncomplete = todos.find(
      (todo) => !todo.completed && todo.id !== currentTask?.id,
    );
    if (!nextIncomplete) return;
    setIsPlaying(false);
    endTimeRef.current = null;
    void selectTask(nextIncomplete);
  };

  // 残り時間を1分延長する
  const handleExtend = () => {
    const newRemaining = remainingTimeRef.current + 60;
    remainingTimeRef.current = newRemaining;
    setActiveDuration(newRemaining);
    setTimerKey((prev) => prev + 1);
    if (isPlaying) {
      endTimeRef.current = Date.now() + newRemaining * 1000;
    }
  };

  const handleToggleFromHome = (todo: Todo) => {
    void toggleTodo(todo.id);
  };

  const handleSelectFromHome = (todo: Todo) => {
    if (todo.completed) return;
    setIsPlaying(false);
    endTimeRef.current = null;
    void selectTask(todo);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* 0. ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.appTitle}>⏱️ ポモドーロタイマー</Text>
          <Link href="/(tabs)/history" asChild>
            <Pressable style={styles.historyButton}>
              <Text style={styles.historyButtonText}>📅 履歴</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* 1. 現在のステータス・タスク表示領域 */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>
          {currentTask?.type === "break" ? "☕ 休憩中" : "🎯 現在の作業"}
        </Text>
        <Text style={styles.currentTaskText}>
          {currentTask?.title || "タスクが選択されていません"}
        </Text>
      </View>

      {/* 2. タイマー表示領域 */}
      <View style={styles.timerCircleWrapper}>
        <CountdownCircleTimer
          isPlaying={isPlaying}
          key={timerComponentKey}
          duration={activeDuration || 1500}
          colors={["#3ac404", "#ffc30d", "#A30000"]}
          //残り何秒になったら色を変えるかの指定（上のcolorsの配列と対応させる）
          colorsTime={[
            Math.floor((activeDuration * 2) / 3),
            Math.floor((activeDuration * 1) / 3),
            0,
          ]}
          onUpdate={(remainingTime) => {
            remainingTimeRef.current = remainingTime;
          }}
          onComplete={() => {
            endTimeRef.current = null;
            void completeCurrentTask(currentTask?.id);
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
          onPress={handleStartPause}
          accessibilityLabel={isPlaying ? "一時停止" : "スタート"}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? "一時停止" : "スタート"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          accessibilityLabel="リセット"
        >
          <Text style={styles.buttonText}>リセット</Text>
        </Pressable>
      </View>
      <View style={styles.quickActionRow}>
        <Pressable
          style={styles.quickActionButton}
          onPress={handleExtend}
          accessibilityLabel="1分延長"
        >
          <Text style={styles.quickActionText}>＋1分</Text>
        </Pressable>
        <Pressable
          style={styles.quickActionButton}
          onPress={handleSkip}
          accessibilityLabel="次のタスクへスキップ"
        >
          <Text style={styles.quickActionText}>⏭ スキップ</Text>
        </Pressable>
      </View>

      {/* 4. 【新機能】メイン画面下部のタスク一覧表示領域 */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>📋 今日のタスク一覧</Text>

        {todos.length === 0 ? (
          <Text style={styles.emptyText}>
            タスクがありません。右下のボタンから追加してください。
          </Text>
        ) : (
          todos.map((todo) => {
            const isActive = currentTask?.id === todo.id;
            return (
              <Pressable
                key={todo.id}
                style={[
                  styles.todoItem,
                  todo.type === "break" && styles.breakTodoItem,
                  isActive && styles.activeTodoItem,
                  todo.completed && styles.completedTodoItem,
                ]}
                onPress={() => handleSelectFromHome(todo)}
              >
                <Pressable
                  style={styles.checkbox}
                  onPress={() => handleToggleFromHome(todo)}
                  accessibilityLabel={
                    todo.completed ? "未完了に戻す" : "完了にする"
                  }
                  hitSlop={8}
                >
                  <Text style={styles.checkboxText}>
                    {todo.completed ? "✅" : "⭕"}
                  </Text>
                </Pressable>
                <Text
                  style={[
                    styles.todoText,
                    isActive && !todo.completed && styles.activeTodoText,
                    todo.completed && styles.todoTextCompleted,
                  ]}
                >
                  {todo.type === "break" ? "☕ " : isActive ? "🔥 " : "👉 "}
                  {todo.title}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
      </ScrollView>

      {/* 5. 画面端の「＋」ボタン（ToDo編集画面へのリンク） */}
      <Link href="/(tabs)" asChild>
        <Pressable style={styles.fab} accessibilityLabel="タスクを編集">
          <Text style={styles.fabText}>➕</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  pageScroll: {
    flex: 1,
  },
  pageScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#007aff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1d1d1f",
  },
  historyButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  historyButtonText: {
    color: "#007aff",
    fontSize: 15,
    fontWeight: "600",
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
    marginBottom: 12,
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
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    backgroundColor: "#e5e5ea",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  quickActionText: {
    color: "#1d1d1f",
    fontSize: 14,
    fontWeight: "600",
  },
  listSection: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d2d2d7",
    paddingTop: 20,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#86868b",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#8e8e93",
    marginTop: 20,
    fontSize: 14,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  breakTodoItem: {
    backgroundColor: "#fff8dc",
    borderColor: "#ffe0a3",
  },
  activeTodoItem: {
    borderColor: "#007aff",
    backgroundColor: "#e3f2fd", // 現在選択中のタスクは背景を薄い青にする
  },
  completedTodoItem: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 18,
  },
  todoText: {
    fontSize: 16,
    color: "#1d1d1f",
    flex: 1,
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
