import { Stack } from "expo-router";
import { Platform, SafeAreaView, StyleSheet, View } from "react-native";
import mobileAds, {
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";
import { TodoProvider } from "../contexts/TodoContext";

// AdMob SDK 初期化
mobileAds()
  .initialize()
  .then((adapterStatuses) => {
    // Initialization complete!
  });

// テスト用IDを使用
// OSごとに本番用の広告ユニットIDを切り替える
const adUnitId = Platform.select({
  ios: "ca-app-pub-3940256099942544/2934735716",
  android: "ca-app-pub-3940256099942544/6300978111",
  default: "",
});

export default function RootLayout() {
  return (
    <TodoProvider>
      <SafeAreaView style={styles.container}>
        {/* ヘッダー広告 */}
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>

        {/* メインコンテンツ */}
        <View style={styles.mainContent}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ presentation: "modal" }} />
          </Stack>
        </View>

        {/* フッター広告 */}
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      </SafeAreaView>
    </TodoProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  mainContent: {
    flex: 1,
  },
  adContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#fff",
  },
});
