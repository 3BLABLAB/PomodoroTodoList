import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// タスクの型定義
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  duration?: number; // タスクの所要時間（秒単位）
  type: "work" | "break";
}

export interface Settings {
  autoBreakEnabled: boolean; // タスク追加時に自動で休憩を挿入するか
  breakDuration: number; // 自動挿入する休憩の長さ（分）
}

const DEFAULT_SETTINGS: Settings = {
  autoBreakEnabled: false,
  breakDuration: 5,
};

// Contextが提供するデータの型定義
interface TodoContextType {
  todos: Todo[];
  currentTask: Todo | null;
  settings: Settings;
  addTodo: (title: string, duration?: number, type?: "work" | "break") => Promise<void>;
  editTodo: (id: string, updates: { title?: string; duration?: number }) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  selectTask: (todo: Todo | null) => Promise<void>;
  moveTodoUp: (id: string) => Promise<void>;
  moveTodoDown: (id: string) => Promise<void>;
  reorderTodos: (newTodos: Todo[]) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = "@todo_list_data";
const SETTINGS_KEY = "@todo_settings";

// 自動採番された休憩（"休憩1"のような既定名）だけを連番で振り直す
const normalizeBreaks = (items: Todo[]) => {
  const updated = items.map((todo) => ({ ...todo }));
  let breakIndex = 0;
  updated.forEach((todo) => {
    if (todo.type === "break") {
      breakIndex += 1;
      if (/^休憩\d+$/.test(todo.title)) {
        todo.title = `休憩${breakIndex}`;
      }
    }
  });
  return updated;
};

// 旧データ（typeフィールドが無い）を補完する
const migrateTodos = (items: Todo[]) =>
  items.map((todo) => ({
    ...todo,
    type: todo.type ?? (/^休憩\d+$/.test(todo.title) ? "break" : "work"),
  }));

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // タイマーに表示する「未完了の先頭タスク」
  const currentTask = todos.find((todo) => !todo.completed) || null;

  // アプリ起動時に端末からデータを読み込む
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const parsedTodos = migrateTodos(JSON.parse(jsonValue) as Todo[]);
          setTodos(normalizeBreaks(parsedTodos));
        }
        const settingsValue = await AsyncStorage.getItem(SETTINGS_KEY);
        if (settingsValue != null) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsValue) });
        }
      } catch (e) {
        console.error("データの読み込みに失敗しました", e);
      }
    };
    loadTodos();
  }, []);

  // データを保存するヘルパー関数
  const saveTodos = async (newTodos: Todo[]) => {
    try {
      const normalizedTodos = normalizeBreaks(newTodos);
      const jsonValue = JSON.stringify(normalizedTodos);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("データの保存に失敗しました", e);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error("設定の保存に失敗しました", e);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await saveSettings(updated);
  };

  // タスクの追加（work追加時は設定に応じて休憩を自動で後ろに挿入する）
  const addTodo = async (
    title: string,
    duration?: number,
    type: "work" | "break" = "work",
  ) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      duration: duration ? duration * 60 : undefined,
      completed: false,
      type,
    };

    let updated = [...todos, newTodo];

    if (type === "work" && settings.autoBreakEnabled) {
      const breakTodo: Todo = {
        id: (Date.now() + 1).toString(),
        title: "休憩",
        duration: settings.breakDuration * 60,
        completed: false,
        type: "break",
      };
      updated = [...updated, breakTodo];
    }

    updated = normalizeBreaks(updated);
    setTodos(updated);
    await saveTodos(updated);
  };

  // タスクの編集（タイトル・所要時間）
  const editTodo = async (
    id: string,
    updates: { title?: string; duration?: number },
  ) => {
    const updated = todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.duration !== undefined
              ? { duration: updates.duration * 60 }
              : {}),
          }
        : todo,
    );
    setTodos(updated);
    await saveTodos(updated);
  };

  // タスクの削除
  const deleteTodo = async (id: string) => {
    const updated = todos.filter((todo) => todo.id !== id);
    setTodos(updated);
    await saveTodos(updated);
  };

  // タスクの完了トグル（削除はせず、完了状態として一覧に残す）
  const toggleTodo = async (id: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    );
    setTodos(updated);
    await saveTodos(updated);
  };

  const moveTodo = async (id: string, direction: "up" | "down") => {
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= todos.length) return;

    const updated = [...todos];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setTodos(updated);
    await saveTodos(updated);
  };

  const moveTodoUp = async (id: string) => {
    await moveTodo(id, "up");
  };

  const moveTodoDown = async (id: string) => {
    await moveTodo(id, "down");
  };

  // ドラッグ&ドロップ等、並び順全体を一括で入れ替える
  const reorderTodos = async (newTodos: Todo[]) => {
    setTodos(newTodos);
    await saveTodos(newTodos);
  };

  // タイマーに表示する現在のタスクを選択（選択したタスクをキュー先頭へ移動）
  const selectTask = async (todo: Todo | null) => {
    if (!todo) return;
    const updated = [todo, ...todos.filter((item) => item.id !== todo.id)];
    setTodos(updated);
    await saveTodos(updated);
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        currentTask,
        settings,
        addTodo,
        editTodo,
        deleteTodo,
        toggleTodo,
        selectTask,
        moveTodoUp,
        moveTodoDown,
        reorderTodos,
        updateSettings,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

// 共通データを各画面から簡単に呼び出すためのカスタムHook
export function useTodo() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodo は TodoProvider の内側で使用してください");
  }
  return context;
}
