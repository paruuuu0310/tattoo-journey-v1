import GoogleVisionService from "./GoogleVisionService";
import firestore from "@react-native-firebase/firestore";
import { AIAnalysisResult, TattooStyle, PortfolioItem } from "../types";
import { ErrorHandler } from "../utils/ErrorHandler";

export interface AnalysisComparison {
  styleMatch: number;
  colorSimilarity: number;
  motifOverlap: number;
  complexitySimilarity: number;
  overallCompatibility: number;
}

export interface PortfolioAnalysisResult {
  portfolioItem: PortfolioItem;
  comparison: AnalysisComparison;
  matchScore: number;
}

export class ImageAnalysisService {
  private static instance: ImageAnalysisService;

  private constructor() {}

  public static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  /**
   * 画像を包括的に分析する
   */
  async analyzeImageComprehensive(
    imageBase64: string,
  ): Promise<AIAnalysisResult> {
    const analysis = await GoogleVisionService.analyzeImage(imageBase64);

    // 分析結果を更に詳しく処理
    const enhancedAnalysis = await this.enhanceAnalysis(analysis);

    return enhancedAnalysis;
  }

  /**
   * 分析結果を強化する
   */
  private async enhanceAnalysis(
    baseAnalysis: AIAnalysisResult,
  ): Promise<AIAnalysisResult> {
    // 色彩の詳細分析
    const enhancedColorAnalysis = this.analyzeColorHarmony(
      baseAnalysis.colorPalette,
    );

    // スタイルの信頼度向上
    const enhancedStyleAnalysis = this.refineStyleDetection(baseAnalysis);

    // 複雑さの詳細分析
    const enhancedComplexityAnalysis = this.analyzeDetailLevel(baseAnalysis);

    return {
      ...baseAnalysis,
      colorPalette: enhancedColorAnalysis.colors,
      isColorful: enhancedColorAnalysis.isColorful,
      style: enhancedStyleAnalysis.style,
      complexity: enhancedComplexityAnalysis,
      confidence: Math.max(
        baseAnalysis.confidence,
        enhancedStyleAnalysis.confidence,
      ),
    };
  }

  /**
   * 色彩調和の分析
   */
  private analyzeColorHarmony(colorPalette: string[]): {
    colors: string[];
    isColorful: boolean;
  } {
    if (colorPalette.length === 0) {
      return { colors: [], isColorful: false };
    }

    // 色の明度と彩度を分析
    const colorAnalyses = colorPalette.map((hex) => {
      const rgb = this.hexToRgb(hex);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      return { hex, ...rgb, ...hsl };
    });

    // 彩度の分散を計算
    const saturations = colorAnalyses.map((c) => c.s);
    const avgSaturation =
      saturations.reduce((a, b) => a + b, 0) / saturations.length;
    const saturationVariance =
      saturations.reduce((acc, s) => acc + Math.pow(s - avgSaturation, 2), 0) /
      saturations.length;

    const isColorful = avgSaturation > 0.3 && saturationVariance > 0.1;

    // 色を調和性でソート
    const harmonizedColors = colorAnalyses
      .sort((a, b) => b.s - a.s) // 彩度順
      .slice(0, 6)
      .map((c) => c.hex);

    return { colors: harmonizedColors, isColorful };
  }

  /**
   * スタイル検出の精密化
   */
  private refineStyleDetection(analysis: AIAnalysisResult): {
    style: TattooStyle;
    confidence: number;
  } {
    const styleScores: Record<TattooStyle, number> = {
      リアリズム: 0,
      トラディショナル: 0,
      ネオトラディショナル: 0,
      ジャパニーズ: 0,
      "ブラック＆グレー": 0,
      カラー: 0,
      ジオメトリック: 0,
      ミニマル: 0,
      トライバル: 0,
      バイオメカニクス: 0,
      オールドスクール: 0,
      レタリング: 0,
      ポートレート: 0,
    };

    // 色彩情報からのスタイル推定
    if (analysis.isColorful) {
      styleScores["カラー"] += 0.4;
      styleScores["ネオトラディショナル"] += 0.3;
    } else {
      styleScores["ブラック＆グレー"] += 0.4;
      styleScores["リアリズム"] += 0.2;
    }

    // 複雑さからのスタイル推定
    switch (analysis.complexity) {
      case "シンプル":
        styleScores["ミニマル"] += 0.4;
        styleScores["レタリング"] += 0.2;
        break;
      case "中程度":
        styleScores["トラディショナル"] += 0.3;
        styleScores["オールドスクール"] += 0.2;
        break;
      case "複雑":
        styleScores["リアリズム"] += 0.4;
        styleScores["バイオメカニクス"] += 0.3;
        break;
    }

    // モチーフからのスタイル推定
    analysis.motifs.forEach((motif) => {
      switch (motif) {
        case "動物":
          styleScores["リアリズム"] += 0.2;
          styleScores["ジャパニーズ"] += 0.1;
          break;
        case "花":
          styleScores["ジャパニーズ"] += 0.3;
          styleScores["トラディショナル"] += 0.2;
          break;
        case "人物":
          styleScores["リアリズム"] += 0.4;
          styleScores["ポートレート"] += 0.3;
          break;
        case "幾何学":
          styleScores["ジオメトリック"] += 0.5;
          styleScores["ミニマル"] += 0.2;
          break;
        case "機械":
          styleScores["バイオメカニクス"] += 0.5;
          break;
        case "スカル":
          styleScores["オールドスクール"] += 0.3;
          styleScores["トラディショナル"] += 0.2;
          break;
        case "文字":
          styleScores["レタリング"] += 0.5;
          break;
      }
    });

    // 最も高いスコアのスタイルを選択
    const bestStyleEntry = Object.entries(styleScores).reduce((a, b) =>
      styleScores[a[0] as TattooStyle] > styleScores[b[0] as TattooStyle]
        ? a
        : b,
    );

    const confidence = Math.min(
      bestStyleEntry[1] + analysis.confidence * 0.3,
      1.0,
    );

    return {
      style: bestStyleEntry[0] as TattooStyle,
      confidence: Math.max(confidence, analysis.confidence),
    };
  }

  /**
   * 詳細レベルの分析
   */
  private analyzeDetailLevel(
    analysis: AIAnalysisResult,
  ): "シンプル" | "中程度" | "複雑" {
    let complexityScore = 0;

    // ラベル数による複雑さ
    const labelCount = analysis.rawLabels.length;
    if (labelCount > 15) complexityScore += 2;
    else if (labelCount > 8) complexityScore += 1;

    // モチーフ数による複雑さ
    const motifCount = analysis.motifs.length;
    if (motifCount > 4) complexityScore += 2;
    else if (motifCount > 2) complexityScore += 1;

    // 色数による複雑さ
    const colorCount = analysis.colorPalette.length;
    if (colorCount > 5) complexityScore += 1;
    if (analysis.isColorful) complexityScore += 1;

    // 高信頼度ラベルの数
    const highConfidenceLabels = analysis.rawLabels.filter(
      (label) => label.confidence > 0.8,
    );
    if (highConfidenceLabels.length > 10) complexityScore += 1;

    if (complexityScore >= 5) return "複雑";
    if (complexityScore >= 2) return "中程度";
    return "シンプル";
  }

  /**
   * 2つの分析結果を比較する
   */
  compareAnalyses(
    analysis1: AIAnalysisResult,
    analysis2: AIAnalysisResult,
  ): AnalysisComparison {
    // スタイルマッチ度
    const styleMatch = analysis1.style === analysis2.style ? 1.0 : 0.0;

    // 色の類似度
    const colorSimilarity = this.calculateColorSimilarity(
      analysis1.colorPalette,
      analysis2.colorPalette,
    );

    // モチーフの重複度
    const motifOverlap = this.calculateMotifOverlap(
      analysis1.motifs,
      analysis2.motifs,
    );

    // 複雑さの類似度
    const complexitySimilarity = this.calculateComplexitySimilarity(
      analysis1.complexity,
      analysis2.complexity,
    );

    // 総合互換性スコア
    const overallCompatibility =
      styleMatch * 0.4 +
      colorSimilarity * 0.25 +
      motifOverlap * 0.25 +
      complexitySimilarity * 0.1;

    return {
      styleMatch,
      colorSimilarity,
      motifOverlap,
      complexitySimilarity,
      overallCompatibility,
    };
  }

  /**
   * ポートフォリオとの互換性分析
   */
  async analyzePortfolioCompatibility(
    customerAnalysis: AIAnalysisResult,
    artistId: string,
  ): Promise<PortfolioAnalysisResult[]> {
    try {
      // アーティストのポートフォリオを取得
      const portfolioSnapshot = await firestore()
        .collection("portfolioItems")
        .where("artistId", "==", artistId)
        .get();

      const results: PortfolioAnalysisResult[] = [];

      for (const doc of portfolioSnapshot.docs) {
        const portfolioItem = { id: doc.id, ...doc.data() } as PortfolioItem;

        if (portfolioItem.aiAnalysis) {
          const comparison = this.compareAnalyses(
            customerAnalysis,
            portfolioItem.aiAnalysis,
          );
          const matchScore = this.calculateMatchScore(
            comparison,
            customerAnalysis,
            portfolioItem.aiAnalysis,
          );

          results.push({
            portfolioItem,
            comparison,
            matchScore,
          });
        }
      }

      // マッチスコアでソート
      return results.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      const handledError = ErrorHandler.handleError(error as Error, {
        service: "ImageAnalysisService",
        method: "analyzePortfolioCompatibility",
        context: "portfolio_compatibility_analysis",
        artistId: artistId,
      });

      // 空配列を返すが、エラーは適切にログ記録される
      return [];
    }
  }

  /**
   * マッチスコアを計算
   */
  private calculateMatchScore(
    comparison: AnalysisComparison,
    customerAnalysis: AIAnalysisResult,
    portfolioAnalysis: AIAnalysis,
  ): number {
    let baseScore = comparison.overallCompatibility;

    // 信頼度による調整
    const avgConfidence =
      (customerAnalysis.confidence + portfolioAnalysis.confidence) / 2;
    baseScore *= avgConfidence;

    // カラフルさの互換性
    if (customerAnalysis.isColorful === portfolioAnalysis.isColorful) {
      baseScore += 0.1;
    }

    return Math.min(baseScore, 1.0);
  }

  /**
   * 色の類似度を計算
   */
  private calculateColorSimilarity(
    colors1: string[],
    colors2: string[],
  ): number {
    if (colors1.length === 0 && colors2.length === 0) return 1.0;
    if (colors1.length === 0 || colors2.length === 0) return 0.0;

    const hsl1 = colors1.map((c) => this.hexToHsl(c));
    const hsl2 = colors2.map((c) => this.hexToHsl(c));

    let totalSimilarity = 0;
    let comparisons = 0;

    hsl1.forEach((color1) => {
      hsl2.forEach((color2) => {
        const similarity = this.calculateHslSimilarity(color1, color2);
        totalSimilarity += similarity;
        comparisons++;
      });
    });

    return comparisons > 0 ? totalSimilarity / comparisons : 0.0;
  }

  /**
   * モチーフの重複度を計算
   */
  private calculateMotifOverlap(motifs1: string[], motifs2: string[]): number {
    if (motifs1.length === 0 && motifs2.length === 0) return 1.0;
    if (motifs1.length === 0 || motifs2.length === 0) return 0.0;

    const overlap = motifs1.filter((motif) => motifs2.includes(motif));
    const union = [...new Set([...motifs1, ...motifs2])];

    return overlap.length / union.length;
  }

  /**
   * 複雑さの類似度を計算
   */
  private calculateComplexitySimilarity(
    complexity1: "シンプル" | "中程度" | "複雑",
    complexity2: "シンプル" | "中程度" | "複雑",
  ): number {
    if (complexity1 === complexity2) return 1.0;

    const complexityLevels = { シンプル: 0, 中程度: 1, 複雑: 2 };
    const diff = Math.abs(
      complexityLevels[complexity1] - complexityLevels[complexity2],
    );

    return Math.max(0, 1 - diff / 2);
  }

  // ヘルパー関数群
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

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const rgb = this.hexToRgb(hex);
    return this.rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  private calculateHslSimilarity(
    hsl1: { h: number; s: number; l: number },
    hsl2: { h: number; s: number; l: number },
  ): number {
    // 色相の差（円形なので特別な計算）
    const hueDiff =
      Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) /
      180;

    // 彩度と明度の差
    const satDiff = Math.abs(hsl1.s - hsl2.s);
    const lightDiff = Math.abs(hsl1.l - hsl2.l);

    // 重み付き類似度
    const similarity = 1 - (hueDiff * 0.5 + satDiff * 0.3 + lightDiff * 0.2);
    return Math.max(0, similarity);
  }
}

export default ImageAnalysisService.getInstance();
