# Pomodoro Todo List

Todo リストと連動した Pomodoro タイマーアプリです。Expo Router + React Native (TypeScript) で構築されており、Web / iOS / Android のクロスプラットフォームで動作します。

## 主な機能

- タスクごとに作業時間を設定できる Pomodoro タイマー（円形プログレス表示）
- タスクの追加・編集・並べ替え（ドラッグ&ドロップ）・完了管理
- 作業タスクの後に休憩タスクを自動挿入する設定
- タイマー終了時のローカル通知＋サウンド再生
- タイマー再生中は画面スリープを防止（Keep Awake）
- バックグラウンド／ロック中もタイマーのズレを補正
- AsyncStorage によるタスク・設定のローカル永続化
- AdMob バナー広告（テスト広告ユニットIDを使用）

## 動作環境

- Expo SDK 54
- Node.js（`npm` が利用できる環境）
- Expo Go、または開発ビルド（EAS Build 等）

> **Note:** SDK 53 以降、Expo Go ではリモートプッシュ通知が利用できません。本アプリはローカル通知のみを使用していますが、通知・サウンド周りを実機で正確に検証したい場合は開発ビルドの利用を推奨します。

## セットアップ

```bash
npm install
```

## 実行方法

```bash
npx expo start      # 開発サーバー起動（QRコードからExpo Goで実行）
npm run android      # Androidエミュレータ/実機で起動
npm run ios          # iOSシミュレータで起動
npm run web          # Webブラウザで起動
```

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run start` / `npx expo start` | Expo 開発サーバーを起動 |
| `npm run android` | Android向けに起動 |
| `npm run ios` | iOS向けに起動 |
| `npm run web` | Web向けに起動 |
| `npm run lint` | ESLint（`eslint-config-expo`）によるチェック |

## 主なパッケージ

- `expo` / `expo-router` - アプリ基盤・ファイルベースルーティング
- `expo-notifications` - タイマー終了時のローカル通知
- `expo-audio` - 通知音（サウンド）の再生
- `expo-keep-awake` - タイマー再生中の画面スリープ防止
- `@react-native-async-storage/async-storage` - タスク・設定のローカル保存
- `react-native-countdown-circle-timer` - 円形タイマーUI
- `react-native-gesture-handler` / `react-native-reanimated` - ジェスチャー・アニメーション
- `react-native-google-mobile-ads` - AdMobバナー広告

## ディレクトリ構成

- `src/app/` - Expo Router の画面・ルーティング（詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照）
- `src/contexts/` - `TodoContext` などのグローバル状態管理
- `assets/` - アイコン・画像・通知サウンドなどの静的アセット
- `example/` - `create-expo-app` 標準テンプレートの参考実装（アプリ本体からは未使用）

ファイル単位の役割は [ARCHITECTURE.md](./ARCHITECTURE.md) にまとめています。

## ライセンス

`LICENSE` を参照してください。
