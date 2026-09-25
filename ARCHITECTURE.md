# ファイル構成ガイド

このアプリを構成する主要ファイルと、それぞれの役割をまとめたものです。

## アプリ本体（`src/`）

| ファイル | 役割 |
| --- | --- |
| `src/app/_layout.tsx` | ルートレイアウト。`TodoProvider` でアプリ全体を包み、AdMob SDK の初期化、ヘッダー/フッターのバナー広告表示、画面遷移用の `Stack`（`index` / `(tabs)`）を定義する。 |
| `src/app/index.tsx` | ホーム画面（Pomodoroタイマー画面）。現在のタスク表示、円形カウントダウンタイマー、スタート/一時停止/リセット/延長/スキップ操作、タイマー終了時の通知・サウンド再生、Todo一覧の簡易表示を担当する。 |
| `src/app/(tabs)/_layout.tsx` | タスク編集画面グループのレイアウト。画面が1つしかないためタブバーは表示せず、通常の `Stack` として扱う。 |
| `src/app/(tabs)/index.tsx` | タスク編集画面。新規タスク／休憩の追加（プリセット時間ボタン付き）、タスクのインライン編集、ドラッグ&ドロップによる並べ替え、削除、自動休憩挿入のON/OFF設定を行う。 |
| `src/contexts/TodoContext.tsx` | アプリ全体で共有するTodo状態・設定を管理する Context / カスタムHook（`useTodo`）。タスクのCRUD、並べ替え、選択中タスクの管理、`AsyncStorage` への永続化・復元、旧データのマイグレーションを担当する。 |

## 設定・ビルド関連

| ファイル | 役割 |
| --- | --- |
| `app.json` | Expo アプリ設定（アプリ名、アイコン、スプラッシュ、Androidアダプティブアイコン、`expo-router` / `expo-notifications` / `react-native-google-mobile-ads` などのプラグイン設定）。 |
| `package.json` | 依存パッケージとnpmスクリプトの定義。エントリーポイントは `expo-router/entry`。 |
| `tsconfig.json` | TypeScript設定。`@/*` を `src/*` に、`@/assets/*` を `assets/*` にマッピングするパスエイリアスを定義。 |
| `eslint.config.js` | ESLint設定。`eslint-config-expo` のフラット設定をベースに使用。 |
| `expo-env.d.ts` | Expo が生成する型定義ファイル（自動生成、編集不要）。 |

## アセット・補助スクリプト

| ファイル | 役割 |
| --- | --- |
| `assets/sounds/timer_complete.wav` | タイマー終了時に再生される通知音。 |
| `assets/images/` | アプリアイコン、スプラッシュ画像、Android用アダプティブアイコン素材など。 |
| `assets/expo.icon/` | iOS用アイコンアセット（`app.json` の `ios.icon` から参照）。 |
| `generate-bell.js` | `assets/sounds/timer_complete.wav` を生成するNode.jsスクリプト（ベル音のWAVファイルを合成する）。通常は再実行不要。 |

## 参考・未使用コード

| ファイル/ディレクトリ | 役割 |
| --- | --- |
| `example/` | `create-expo-app` の標準テンプレート一式（画面例・コンポーネント例・`reset-project.js` など）。アプリ本体からは読み込まれておらず、実装の参考用として残されている。 |

## その他

| ファイル | 役割 |
| --- | --- |
| `AGENTS.md` / `CLAUDE.md` | AIコーディングアシスタント向けの作業指示（Expo公式ドキュメントを参照してから実装するよう指示）。 |
| `LICENSE` | ライセンス条項。 |
