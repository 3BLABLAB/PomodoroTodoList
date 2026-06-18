# Pomodoro Todo List

シンプルな Pomodoro タイマーと Todo 管理を組み合わせた Expo + React Native (TypeScript) アプリです。

## 概要

- Expo Router を使った React Native アプリ
- アプリ内で Pomodoro タイマーを管理し、Todo アイテムを追加・編集できる
- Web / Android / iOS で動作するクロスプラットフォーム構成

## セットアップ

```bash
npm install
```

## 実行方法

```bash
npm run start
npm run web
npm run android
npm run ios
npx expo start
```

### 利用中の主なパッケージ

- `expo`
- `expo-router`
- `react` / `react-native`
- `react-native-reanimated`
- `react-native-gesture-handler`
- `react-native-svg`
- `react-countdown-circle-timer`

## ディレクトリ構成

- `app/` - Expo Router の画面・ルーティング
- `src/contexts/` - `TodoContext` などの状態管理
- `assets/` - 画像、アイコン、静的アセット
- `example/` - 追加のサンプルや参考実装

## スクリプト

- `npm run start` - Expo 開発サーバー起動
- `npm run web` - Web 向けで起動
- `npm run android` - Android エミュレータ/デバイス起動
- `npm run ios` - iOS シミュレータ起動
- `npm run lint` - Expo の lint チェック

## 備考

- Python の依存は本プロジェクトでは不要です。`requirements.txt` は空の形式で作成済みです。
- `package.json` の依存関係に合わせて、Node 環境で実行してください。

## ライセンス

`LICENSE` を参照してください。
