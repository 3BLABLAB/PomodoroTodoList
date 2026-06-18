import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// タスクの型定義
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  duration?: number; // タスクの所要時間（分単位）
}

// Contextが提供するデータの型定義
interface TodoContextType {
  todos: Todo[];
  currentTask: Todo | null;
  addTodo: (title: string, duration?: number) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  selectTask: (todo: Todo | null) => Promise<void>;
  moveTodoUp: (id: string) => Promise<void>;
  moveTodoDown: (id: string) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = "@todo_list_data";

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const currentTask = todos[0] || null;

  // アプリ起動時に端末からデータを読み込む
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          setTodos(JSON.parse(jsonValue));
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
      const jsonValue = JSON.stringify(newTodos);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("データの保存に失敗しました", e);
    }
  };

  // タスクの追加
  const addTodo = async (title: string, duration?: number) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      duration: duration ? duration * 60 : undefined,
      completed: false,
    };
    const updated = [...todos, newTodo];
    setTodos(updated);
    await saveTodos(updated);
  };

  // タスクの削除
  const deleteTodo = async (id: string) => {
    const updated = todos.filter((todo) => todo.id !== id);
    setTodos(updated);
    await saveTodos(updated);
  };

  // タスクの完了トグル
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
        addTodo,
        deleteTodo,
        toggleTodo,
        selectTask,
        moveTodoUp,
        moveTodoDown,
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
