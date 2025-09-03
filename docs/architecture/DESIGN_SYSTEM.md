# Tattoo Journey 2.0 Design System

アートとタトゥー文化にインスパイアされたデザインシステムです。ダークテーマを基調とし、ネオンアクセント、芸術的なコンポーネントで構成されています。

## 🎨 デザイン哲学

### アート系コンセプト

- **Dark & Neon**: 暗い背景に鮮やかなネオンアクセント
- **Tattoo Inspired**: 伝統的なタトゥーカラーパレット
- **Artistic Elements**: 有機的な形状と創造的なアニメーション
- **Professional Feel**: 高品質でプロフェッショナルな印象

### カラーパレット

#### プライマリーカラー

- **Brand Red (#ff6b6b)**: メインブランドカラー、タトゥーレッドからインスパイア
- **Dark Background (#1a1a1a)**: 深い暗闇、作品を際立たせる
- **Surface Gray (#2a2a2a)**: カードや表面要素

#### アクセントカラー

- **Electric Blue (#00f5ff)**: 電気的なブルー
- **Neon Green (#39ff14)**: ネオングリーン
- **Gold (#ffd700)**: 豪華なゴールド
- **Violet (#8a2be2)**: 神秘的なバイオレット

## 🧱 コンポーネント

### TattooButton

多様なスタイルと効果を持つボタンコンポーネント

```tsx
import { TattooButton } from '@/components/design-system';

// 基本的な使用法
<TattooButton
  title="予約する"
  onPress={() => {}}
  variant="primary"
/>

// ネオン効果付き
<TattooButton
  title="検索"
  onPress={() => {}}
  variant="neon"
  neonEffect={true}
/>

// アイコン付き
<TattooButton
  title="保存"
  onPress={() => {}}
  icon={<SaveIcon />}
  iconPosition="left"
/>
```

**バリエーション:**

- `primary`: メインアクション（赤ベース）
- `secondary`: セカンダリアクション（グレーベース）
- `accent`: アクセントアクション（電気ブルー）
- `ghost`: 透明背景
- `neon`: ネオン効果

### TattooCard

アーティストプロフィールやポートフォリオ表示用カード

```tsx
import { TattooCard, ArtistCard, PortfolioCard } from '@/components/design-system';

// 基本カード
<TattooCard variant="elevated">
  <Text>カードコンテンツ</Text>
</TattooCard>

// アーティストカード
<ArtistCard
  artistName="山田タロウ"
  rating={4.8}
  specialties={['Traditional', 'Blackwork', 'Japanese']}
  onPress={() => navigate('ArtistProfile')}
/>

// ポートフォリオカード
<PortfolioCard
  imageUri="https://example.com/artwork.jpg"
  title="Dragon Sleeve"
  tags={['Dragon', 'Japanese', 'Sleeve']}
  onPress={() => navigate('PortfolioDetail')}
/>
```

### TattooInput

検索、フォーム入力用のインプットコンポーネント

```tsx
import { TattooInput, SearchInput, PasswordInput } from '@/components/design-system';

// 基本入力
<TattooInput
  value={text}
  onChangeText={setText}
  label="お名前"
  placeholder="お名前を入力してください"
  variant="outlined"
/>

// 検索入力
<SearchInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  onSearch={handleSearch}
  placeholder="アーティストを検索..."
/>

// パスワード入力
<PasswordInput
  value={password}
  onChangeText={setPassword}
  label="パスワード"
/>
```

### TattooLoadingSpinner

アーティスティックなローディングスピナー

```tsx
import { TattooLoadingSpinner, FullScreenLoader } from '@/components/design-system';

// 基本スピナー
<TattooLoadingSpinner
  size="md"
  variant="neon"
  message="読み込み中..."
/>

// タトゥーニードル風
<TattooLoadingSpinner
  variant="tattooNeedle"
  size="lg"
/>

// フルスクリーンローダー
<FullScreenLoader message="アーティストを検索中..." />
```

## 🎯 デザイントークン

### カラー使用例

```tsx
import { DesignTokens, getColor } from "@/components/design-system";

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.colors.dark.background,
  },
  text: {
    color: getColor("primary.500"),
  },
});
```

### スペーシング

```tsx
const styles = StyleSheet.create({
  button: {
    padding: DesignTokens.spacing[4], // 16px
    margin: DesignTokens.spacing[2], // 8px
  },
});
```

### タイポグラフィ

```tsx
const styles = StyleSheet.create({
  title: {
    fontSize: DesignTokens.typography.sizes["2xl"], // 24
    fontWeight: DesignTokens.typography.weights.bold,
    fontFamily: DesignTokens.typography.fonts.primary,
  },
});
```

## 🌟 特殊効果

### ネオン効果

```tsx
import { createNeonEffect } from "@/components/design-system";

const neonStyle = {
  ...createNeonEffect(DesignTokens.colors.accent.electric, 0.8),
  backgroundColor: DesignTokens.colors.dark.surface,
  borderRadius: DesignTokens.radius.xl,
};
```

### アーティスティック境界線

```tsx
import { createArtisticBorder } from "@/components/design-system";

const borderStyle = {
  ...createArtisticBorder(DesignTokens.colors.primary[500]),
  padding: DesignTokens.spacing[4],
};
```

## 📱 レスポンシブデザイン

### ブレークポイント

```tsx
const styles = StyleSheet.create({
  container: {
    padding: DesignTokens.spacing[4],
    // タブレット以上で追加パディング
    ...(Dimensions.get("window").width > DesignTokens.breakpoints.md && {
      padding: DesignTokens.spacing[6],
    }),
  },
});
```

## 🎨 使用ガイドライン

### Do's (推奨)

✅ ダークテーマを基調とする  
✅ ネオンアクセントを効果的に使用  
✅ 芸術的で有機的な形状を採用  
✅ 適切なコントラストを保つ  
✅ アニメーションで生命感を表現

### Don'ts (非推奨)

❌ 明るい背景色は避ける  
❌ 過度なネオン効果は控える  
❌ 可読性を損なうコントラスト  
❌ 不必要に複雑なアニメーション  
❌ ブランドカラー以外のプライマリー色

## 🚀 パフォーマンス考慮

### 最適化のポイント

- ネオン効果はAndroidで`elevation`、iOSで`shadowRadius`を使用
- アニメーションは`useNativeDriver: true`を設定
- 大きな画像には適切な圧縮とキャッシュを実装
- 複雑なグラデーションはパフォーマンスに注意

### アクセシビリティ

- 最小コントラスト比4.5:1を保持
- フォーカス状態を明確に表示
- 適切なタッチターゲットサイズ（44px以上）
- スクリーンリーダー対応のセマンティック要素

## 🔧 技術的実装

### 必要な依存関係

```bash
# グラデーション（オプション）
npm install react-native-linear-gradient

# ベクターアイコン（推奨）
npm install react-native-vector-icons

# アニメーション（React Native内蔵）
# Animated API を使用
```

### テーマプロバイダー（将来実装）

```tsx
import { TattooThemeProvider } from "@/components/design-system";

export default function App() {
  return (
    <TattooThemeProvider>
      <YourApp />
    </TattooThemeProvider>
  );
}
```

このデザインシステムにより、一貫性があり、アートとタトゥー文化を反映した美しいUIを構築できます。
