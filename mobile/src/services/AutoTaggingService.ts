import GoogleVisionService from "./GoogleVisionService";
import ImageAnalysisService from "./ImageAnalysisService";
import firestore from "@react-native-firebase/firestore";
import { AIAnalysisResult, TattooStyle, PortfolioItem } from "../types";

export interface TaggingResult {
  automaticTags: string[];
  confidenceScores: Record<string, number>;
  suggestedTags: string[];
  analysisData: AIAnalysisResult;
}

export interface TagCategory {
  name: string;
  tags: string[];
  priority: number;
}

export class AutoTaggingService {
  private static instance: AutoTaggingService;

  private tagCategories: TagCategory[] = [
    {
      name: "スタイル",
      tags: [
        "リアリズム",
        "トラディショナル",
        "ネオトラディショナル",
        "ジャパニーズ",
        "ブラック&グレー",
        "カラー",
        "ジオメトリック",
        "ミニマル",
        "トライバル",
        "バイオメカニクス",
        "オールドスクール",
        "レタリング",
        "ポートレート",
      ],
      priority: 1,
    },
    {
      name: "モチーフ",
      tags: [
        "動物",
        "花",
        "人物",
        "自然",
        "抽象",
        "文字",
        "記号",
        "スカル",
        "ドラゴン",
        "鳥",
        "魚",
        "昆虫",
        "マンダラ",
        "幾何学",
        "宗教的",
        "音楽",
        "スポーツ",
        "映画",
        "アニメ",
        "ゲーム",
        "機械",
        "宇宙",
      ],
      priority: 2,
    },
    {
      name: "色彩",
      tags: [
        "カラフル",
        "モノクロ",
        "パステル",
        "ビビッド",
        "ダーク",
        "レッド",
        "ブルー",
        "グリーン",
        "イエロー",
        "パープル",
        "オレンジ",
        "ピンク",
        "ブラウン",
        "グレー",
        "ホワイト",
        "ブラック",
      ],
      priority: 3,
    },
    {
      name: "技法",
      tags: [
        "シェーディング",
        "ラインワーク",
        "ドットワーク",
        "ウォーターカラー",
        "スプラッシュ",
        "グラデーション",
        "立体的",
        "フラット",
        "テクスチャ",
        "ブラシストローク",
        "ハッチング",
        "スティップリング",
      ],
      priority: 4,
    },
    {
      name: "サイズ",
      tags: ["小サイズ", "中サイズ", "大サイズ", "特大サイズ"],
      priority: 5,
    },
    {
      name: "配置",
      tags: [
        "腕",
        "脚",
        "背中",
        "胸",
        "肩",
        "首",
        "手",
        "足",
        "顔",
        "指",
        "耳",
        "リブ",
        "ヒップ",
        "お腹",
        "足首",
        "手首",
      ],
      priority: 6,
    },
  ];

  private constructor() {}

  public static getInstance(): AutoTaggingService {
    if (!AutoTaggingService.instance) {
      AutoTaggingService.instance = new AutoTaggingService();
    }
    return AutoTaggingService.instance;
  }

  /**
   * ポートフォリオアイテムの自動タグ付け
   */
  async tagPortfolioItem(
    portfolioItemId: string,
    imageUrl: string,
  ): Promise<TaggingResult> {
    try {
      // 画像をBase64に変換
      const base64 = await GoogleVisionService.convertImageToBase64(imageUrl);

      // AI分析実行
      const analysis =
        await ImageAnalysisService.analyzeImageComprehensive(base64);

      // タグ生成
      const taggingResult = await this.generateTags(analysis);

      // Firestoreに保存
      await this.saveTaggingResult(portfolioItemId, taggingResult);

      return taggingResult;
    } catch (error) {
      console.error("Error in auto-tagging:", error);
      throw error;
    }
  }

  /**
   * 分析結果からタグを生成
   */
  private async generateTags(
    analysis: AIAnalysisResult,
  ): Promise<TaggingResult> {
    const automaticTags: string[] = [];
    const confidenceScores: Record<string, number> = {};
    const suggestedTags: string[] = [];

    // スタイルタグ
    automaticTags.push(analysis.style);
    confidenceScores[analysis.style] = analysis.confidence;

    // 複雑さタグ
    const complexityTag = this.mapComplexityToTag(analysis.complexity);
    automaticTags.push(complexityTag);
    confidenceScores[complexityTag] = analysis.confidence;

    // 色彩タグ
    const colorTags = this.generateColorTags(analysis);
    colorTags.forEach((tag) => {
      automaticTags.push(tag.name);
      confidenceScores[tag.name] = tag.confidence;
    });

    // モチーフタグ
    analysis.motifs.forEach((motif) => {
      automaticTags.push(motif);
      confidenceScores[motif] = 0.8; // モチーフは比較的高い信頼度
    });

    // 技法タグ
    const techniqueTags = this.generateTechniqueTags(analysis);
    techniqueTags.forEach((tag) => {
      automaticTags.push(tag.name);
      confidenceScores[tag.name] = tag.confidence;
    });

    // 提案タグ（低信頼度だが関連性のあるタグ）
    const suggested = this.generateSuggestedTags(analysis);
    suggestedTags.push(...suggested);

    // 重複除去
    const uniqueAutomaticTags = [...new Set(automaticTags)];

    return {
      automaticTags: uniqueAutomaticTags,
      confidenceScores,
      suggestedTags,
      analysisData: analysis,
    };
  }

  /**
   * 色彩タグを生成
   */
  private generateColorTags(
    analysis: AIAnalysisResult,
  ): Array<{ name: string; confidence: number }> {
    const colorTags: Array<{ name: string; confidence: number }> = [];

    // カラフルさ
    if (analysis.isColorful) {
      colorTags.push({ name: "カラフル", confidence: 0.9 });
    } else {
      colorTags.push({ name: "モノクロ", confidence: 0.9 });
    }

    // 主要色の分析
    const colorMapping = {
      "#ff": "レッド",
      "#00ff": "グリーン",
      "#0000ff": "ブルー",
      "#ffff00": "イエロー",
      "#ff00ff": "パープル",
      "#ffa500": "オレンジ",
      "#ffc0cb": "ピンク",
      "#a52a2a": "ブラウン",
    };

    analysis.colorPalette.slice(0, 3).forEach((color) => {
      const detectedColor = this.analyzeColorName(color);
      if (detectedColor) {
        colorTags.push({ name: detectedColor, confidence: 0.7 });
      }
    });

    // 色調の分析
    const toneTag = this.analyzeTone(analysis.colorPalette);
    if (toneTag) {
      colorTags.push({ name: toneTag, confidence: 0.6 });
    }

    return colorTags;
  }

  /**
   * 技法タグを生成
   */
  private generateTechniqueTags(
    analysis: AIAnalysisResult,
  ): Array<{ name: string; confidence: number }> {
    const techniqueTags: Array<{ name: string; confidence: number }> = [];

    // ラベルから技法を推定
    const techniqueKeywords = {
      シェーディング: ["shadow", "shading", "gradient", "depth"],
      ラインワーク: ["line", "outline", "stroke", "linear"],
      ドットワーク: ["dot", "stipple", "pointillism"],
      ウォーターカラー: ["watercolor", "wash", "fluid", "splash"],
      テクスチャ: ["texture", "rough", "smooth", "pattern"],
      グラデーション: ["gradient", "fade", "blend", "transition"],
    };

    analysis.rawLabels.forEach((label) => {
      const description = label.description.toLowerCase();

      Object.entries(techniqueKeywords).forEach(([technique, keywords]) => {
        keywords.forEach((keyword) => {
          if (description.includes(keyword)) {
            techniqueTags.push({
              name: technique,
              confidence: label.confidence * 0.7,
            });
          }
        });
      });
    });

    // 複雑さに基づく技法推定
    switch (analysis.complexity) {
      case "シンプル":
        techniqueTags.push({ name: "ミニマル", confidence: 0.8 });
        techniqueTags.push({ name: "クリーン", confidence: 0.7 });
        break;
      case "複雑":
        techniqueTags.push({ name: "詳細", confidence: 0.8 });
        techniqueTags.push({ name: "精密", confidence: 0.7 });
        break;
    }

    // 重複除去と信頼度でソート
    const uniqueTags = new Map<string, number>();
    techniqueTags.forEach((tag) => {
      if (
        !uniqueTags.has(tag.name) ||
        uniqueTags.get(tag.name)! < tag.confidence
      ) {
        uniqueTags.set(tag.name, tag.confidence);
      }
    });

    return Array.from(uniqueTags.entries()).map(([name, confidence]) => ({
      name,
      confidence,
    }));
  }

  /**
   * 提案タグを生成
   */
  private generateSuggestedTags(analysis: AIAnalysisResult): string[] {
    const suggested: string[] = [];

    // スタイルに基づく関連タグ
    const styleRelatedTags = {
      リアリズム: ["3D効果", "フォトリアル", "ハイパーリアル"],
      ジャパニーズ: ["和風", "伝統的", "日本文化"],
      ジオメトリック: ["数学的", "対称", "パターン"],
      ミニマル: ["シンプル", "エレガント", "モダン"],
      バイオメカニクス: ["SF", "未来的", "メタリック"],
    };

    if (styleRelatedTags[analysis.style as keyof typeof styleRelatedTags]) {
      suggested.push(
        ...styleRelatedTags[analysis.style as keyof typeof styleRelatedTags],
      );
    }

    // モチーフに基づく関連タグ
    analysis.motifs.forEach((motif) => {
      const relatedTags = this.getRelatedMotifTags(motif);
      suggested.push(...relatedTags);
    });

    // 季節性タグ
    const seasonalTags = this.getSeasonalTags(analysis);
    suggested.push(...seasonalTags);

    return [...new Set(suggested)];
  }

  /**
   * 関連モチーフタグを取得
   */
  private getRelatedMotifTags(motif: string): string[] {
    const relatedMap: Record<string, string[]> = {
      動物: ["ネイチャー", "ワイルド", "生命力"],
      花: ["自然", "美しさ", "成長", "季節"],
      人物: ["エモーショナル", "ストーリー", "メモリアル"],
      スカル: ["ゴシック", "ダーク", "メメントモリ"],
      ドラゴン: ["パワー", "神秘", "アジアン"],
      宗教的: ["スピリチュアル", "信仰", "神聖"],
    };

    return relatedMap[motif] || [];
  }

  /**
   * 季節性タグを取得
   */
  private getSeasonalTags(analysis: AIAnalysisResult): string[] {
    const seasonalTags: string[] = [];

    analysis.motifs.forEach((motif) => {
      switch (motif) {
        case "花":
          seasonalTags.push("春");
          break;
        case "海":
        case "太陽":
          seasonalTags.push("夏");
          break;
        case "葉":
          seasonalTags.push("秋");
          break;
        case "雪":
        case "氷":
          seasonalTags.push("冬");
          break;
      }
    });

    return seasonalTags;
  }

  /**
   * 複雑さをタグにマッピング
   */
  private mapComplexityToTag(
    complexity: "シンプル" | "中程度" | "複雑",
  ): string {
    const mapping = {
      シンプル: "シンプル",
      中程度: "中程度",
      複雑: "複雑",
    };

    return mapping[complexity];
  }

  /**
   * 色名を分析
   */
  private analyzeColorName(hex: string): string | null {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    // HSL値に基づく色名判定
    const hue = hsl.h;
    const saturation = hsl.s;
    const lightness = hsl.l;

    if (saturation < 0.1) {
      if (lightness > 0.8) return "ホワイト";
      if (lightness < 0.2) return "ブラック";
      return "グレー";
    }

    if (hue >= 0 && hue < 30) return "レッド";
    if (hue >= 30 && hue < 60) return "オレンジ";
    if (hue >= 60 && hue < 90) return "イエロー";
    if (hue >= 90 && hue < 150) return "グリーン";
    if (hue >= 150 && hue < 210) return "シアン";
    if (hue >= 210 && hue < 270) return "ブルー";
    if (hue >= 270 && hue < 330) return "パープル";
    if (hue >= 330) return "レッド";

    return null;
  }

  /**
   * トーンを分析
   */
  private analyzeTone(colorPalette: string[]): string | null {
    if (colorPalette.length === 0) return null;

    const avgLightness =
      colorPalette.reduce((sum, hex) => {
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return sum + hsl.l;
      }, 0) / colorPalette.length;

    const avgSaturation =
      colorPalette.reduce((sum, hex) => {
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return sum + hsl.s;
      }, 0) / colorPalette.length;

    if (avgSaturation > 0.7) return "ビビッド";
    if (avgSaturation < 0.3 && avgLightness > 0.7) return "パステル";
    if (avgLightness < 0.3) return "ダーク";

    return null;
  }

  /**
   * タグ付け結果を保存
   */
  private async saveTaggingResult(
    portfolioItemId: string,
    result: TaggingResult,
  ): Promise<void> {
    try {
      await firestore()
        .collection("portfolioItems")
        .doc(portfolioItemId)
        .update({
          tags: result.automaticTags,
          aiAnalysis: result.analysisData,
          tagConfidenceScores: result.confidenceScores,
          suggestedTags: result.suggestedTags,
          autoTaggedAt: new Date(),
          updatedAt: new Date(),
        });

      // 自動タグ付け履歴も保存
      await firestore().collection("autoTaggingHistory").add({
        portfolioItemId,
        tags: result.automaticTags,
        confidenceScores: result.confidenceScores,
        analysisData: result.analysisData,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving tagging result:", error);
      throw error;
    }
  }

  /**
   * バッチでポートフォリオをタグ付け
   */
  async batchTagPortfolio(
    artistId: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    try {
      const portfolioSnapshot = await firestore()
        .collection("portfolioItems")
        .where("artistId", "==", artistId)
        .where("autoTaggedAt", "==", null) // まだタグ付けされていないもの
        .get();

      for (const doc of portfolioSnapshot.docs) {
        try {
          const portfolioItem = doc.data() as PortfolioItem;
          await this.tagPortfolioItem(doc.id, portfolioItem.imageUrl);
          success++;
        } catch (error) {
          console.error(`Failed to tag portfolio item ${doc.id}:`, error);
          failed++;
        }

        // レート制限を避けるための短い待機
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Error in batch tagging:", error);
    }

    return { success, failed };
  }

  // ヘルパー関数
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  private rgbToHsl(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }
}

export default AutoTaggingService.getInstance();
