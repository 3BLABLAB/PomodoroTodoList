# 🍅 Pomodoro Todo List

![Expo SDK](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-4630EB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Todo リストと連動した Pomodoro タイマーアプリです。Expo Router + React Native (TypeScript) で構築されており、Web / iOS / Android のクロスプラットフォームで動作します。

## 背景・課題

期限を事前に決めないと作業に取り掛かれない人（開発者）に向けたタスク管理アプリです。従来のTodoアプリでは自分を管理しきれない人でも、タスクに細かい期限を設定するこのアプリを使うことで対処できます。

## 主な機能

- 🍅 タスクごとに作業時間を設定できる Pomodoro タイマー（円形プログレス表示）
- ✅ タスクの追加・編集・並べ替え（↑↓ボタン）・完了管理
- 📅 完了タスクの日別履歴表示
- ☕ 作業タスクの後に休憩タスクを自動挿入する設定
- 🔔 タイマー終了時のローカル通知＋サウンド再生
- 📱 タイマー再生中は画面スリープを防止（Keep Awake）
- ⏱️ バックグラウンド／ロック中もタイマーのズレを補正
- 💾 AsyncStorage によるタスク・設定のローカル永続化

## 機能・内容

- **円形 Pomodoro タイマー**：タスクごとに設定した作業時間を円形プログレスで表示。残り時間の割合（2/3・1/3・0）に応じて色が変化し、どのタスク（時間設定）でも同じ見え方になるよう比率ベースで計算しています。
- **バックグラウンド／ロック中のズレ補正**：タイマー再生中にアプリがバックグラウンドに回ってもズレなく動作するよう、終了時刻（絶対時刻）を基準に残り時間を再計算します。ロック中に時間切れとなっていた場合は、復帰時に自動で完了処理（通知・サウンド再生）を行います。
- **ローカル通知 + サウンド再生**：タイマー終了を通知とサウンドで知らせます。タスク切り替えや一時停止・再開のたびに古い通知を確実にキャンセルしてから再スケジュールし、通知の重複・誤発火を防いでいます。
- **タスク管理**：タスクの追加・編集・↑↓ボタンによる並べ替え・完了管理。作業タスクの後に休憩タスクを自動挿入する設定も可能です。
- **完了履歴**：完了した作業タスクを日付ごとにグルーピングして一覧表示します（休憩タスクは対象外）。
- **画面スリープ防止**：タイマー再生中のみ Keep Awake を有効化し、画面遷移時は確実に解除します。
- **ローカル永続化**：タスク・設定を AsyncStorage に保存し、アプリ再起動後も復元します。


## 動作環境

- Expo SDK 57
- Node.js `20.19.4` / `22.13.0` / `24.3.0` / `25.0.0` 以降のいずれかの系列（`npm` が利用できる環境）
- Expo Go、または開発ビルド（EAS Build 等）

> **Note:** SDK 53 以降、Expo Go ではリモートプッシュ通知が利用できません。本アプリはローカル通知のみを使用していますが、通知・サウンド周りを実機で正確に検証したい場合は開発ビルドの利用を推奨します。

## クイックスタート

```bash
git clone https://github.com/3BLABLAB/PomodoroTodoList.git
cd PomodoroTodoList
npm install
npx expo start
```

起動後にターミナルへ表示されるQRコードを iOS/Android の [Expo Go](https://expo.dev/go) アプリで読み取るか、`w` キーを押してWeb版をブラウザで開くと動作を確認できます。

## 実行方法

```bash
npx expo start       # 開発サーバー起動（QRコードからExpo Goで実行）
npm run android      # Androidエミュレータ/実機で起動
npm run ios          # iOSシミュレータで起動
npm run web          # Webブラウザで起動
```

## スクリプト

| コマンド                           | 説明                                         |
| ----------------------------------- | --------------------------------------------- |
| `npm run start` / `npx expo start` | Expo 開発サーバーを起動                      |
| `npm run android`                  | Android向けに起動                            |
| `npm run ios`                      | iOS向けに起動                                |
| `npm run web`                      | Web向けに起動                                |
| `npm run lint`                     | ESLint（`eslint-config-expo`）によるチェック |

## 主なパッケージ

- `expo` / `expo-router` - アプリ基盤・ファイルベースルーティング
- `expo-notifications` - タイマー終了時のローカル通知
- `expo-audio` - 通知音（サウンド）の再生
- `expo-keep-awake` - タイマー再生中の画面スリープ防止
- `@react-native-async-storage/async-storage` - タスク・設定のローカル保存
- `react-native-countdown-circle-timer` - 円形タイマーUI
- `react-native-gesture-handler` / `react-native-reanimated` - ジェスチャー・アニメーション

## ディレクトリ構成

- `src/app/` - Expo Router の画面・ルーティング（詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照）
- `src/contexts/` - `TodoContext` などのグローバル状態管理
- `assets/` - アイコン・画像・通知サウンドなどの静的アセット
- `example/` - `create-expo-app` 標準テンプレートの参考実装（アプリ本体からは未使用）

ファイル単位の役割は [ARCHITECTURE.md](./ARCHITECTURE.md) にまとめています。

## ライセンス

MIT License。詳細は [LICENSE](./LICENSE) を参照してください。

## 作者

[3BLABLAB](https://github.com/3BLABLAB)
