import { TattooStyle, ImageAnalysis, AIAnalysisResult } from "../types";
import { EnvironmentConfig } from "../config/EnvironmentConfig";

interface GoogleVisionResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      mid: string;
      locale: string;
      description: string;
      score: number;
      topicality: number;
    }>;
    imagePropertiesAnnotation?: {
      dominantColors: {
        colors: Array<{
          color: {
            red: number;
            green: number;
            blue: number;
            alpha?: number;
          };
          score: number;
          pixelFraction: number;
        }>;
      };
    };
    objectLocalizationAnnotations?: Array<{
      mid: string;
      languageCode: string;
      name: string;
      score: number;
      boundingPoly: {
        normalizedVertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
  }>;
}

export class GoogleVisionService {
  private static instance: GoogleVisionService;
  private readonly API_ENDPOINT =
    "https://vision.googleapis.com/v1/images:annotate";

  private constructor() {}

  public static getInstance(): GoogleVisionService {
    if (!GoogleVisionService.instance) {
      GoogleVisionService.instance = new GoogleVisionService();
    }
    return GoogleVisionService.instance;
  }

  async analyzeImage(imageBase64: string): Promise<AIAnalysisResult> {
    try {
      // 入力データの検証
      if (
        !imageBase64 ||
        typeof imageBase64 !== "string" ||
        imageBase64.trim() === ""
      ) {
        throw new Error("Invalid image data provided");
      }

      // APIキーを環境設定から安全に取得
      const apiKey = EnvironmentConfig.getGoogleVisionApiKey();

      // 入力データのサニタイズ
      const sanitizedImageData = this.sanitizeImageData(imageBase64);

      const requestBody = {
        requests: [
          {
            image: {
              content: sanitizedImageData,
            },
            features: [
              {
                type: "LABEL_DETECTION",
                maxResults: 20,
              },
              {
                type: "IMAGE_PROPERTIES",
                maxResults: 1,
              },
              {
                type: "OBJECT_LOCALIZATION",
                maxResults: 10,
              },
            ],
          },
        ],
      };

      const response = await fetch(`${this.API_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const data: GoogleVisionResponse = await response.json();

      // レスポンスの検証とサニタイズ
      this.validateApiResponse(data);
      const sanitizedData = this.sanitizeApiResponse(data);

      return this.processVisionResponse(sanitizedData);
    } catch (error) {
      // セキュアなエラーハンドリング
      this.handleSecureError(error);
      throw new Error("Failed to analyze image. Please try again later.");
    }
  }

  private processVisionResponse(
    response: GoogleVisionResponse,
  ): AIAnalysisResult {
    const firstResponse = response.responses[0];

    if (!firstResponse) {
      throw new Error("No response from Google Vision API");
    }

    // ラベル分析
    const labels = firstResponse.labelAnnotations || [];

    // タトゥースタイル分析
    const style = this.analyzeStyle(labels);

    // 色彩分析
    const colorAnalysis = this.analyzeColors(
      firstResponse.imagePropertiesAnnotation,
    );

    // モチーフ分析
    const motifs = this.analyzeMotifs(
      labels,
      firstResponse.objectLocalizationAnnotations || [],
    );

    // 複雑さ分析
    const complexity = this.analyzeComplexity(labels);

    return {
      style,
      colorPalette: colorAnalysis.dominantColors,
      isColorful: colorAnalysis.isColorful,
      motifs,
      complexity,
      confidence: this.calculateOverallConfidence(labels),
      rawLabels: labels.map((label) => ({
        description: label.description,
        confidence: label.score,
      })),
      processedAt: new Date(),
    };
  }

  private analyzeStyle(labels: any[]): TattooStyle {
    const styleKeywords = {
      リアリズム: [
        "realistic",
        "portrait",
        "photographic",
        "detailed",
        "human face",
        "person",
      ],
      トラディショナル: [
        "traditional",
        "classic",
        "vintage",
        "old school",
        "bold line",
      ],
      ジャパニーズ: [
        "japanese",
        "asian",
        "oriental",
        "dragon",
        "koi",
        "cherry blossom",
        "samurai",
      ],
      "ブラック＆グレー": ["black", "grey", "monochrome", "shading", "shadow"],
      カラー: ["colorful", "bright", "vibrant", "rainbow", "multicolored"],
      オールドスクール: [
        "anchor",
        "rose",
        "skull",
        "heart",
        "swallow",
        "pin up",
      ],
      ネオトラディショナル: [
        "neo traditional",
        "modern",
        "contemporary",
        "stylized",
      ],
      ミニマル: ["simple", "minimal", "line art", "geometric", "clean"],
      レタリング: ["text", "lettering", "script", "calligraphy", "typography"],
      ポートレート: ["face", "portrait", "person", "human"],
    };

    const styleScores: Record<TattooStyle, number> = {
      リアリズム: 0,
      トラディショナル: 0,
      ジャパニーズ: 0,
      "ブラック＆グレー": 0,
      カラー: 0,
      オールドスクール: 0,
      ネオトラディショナル: 0,
      ミニマル: 0,
      レタリング: 0,
      ポートレート: 0,
    };

    labels.forEach((label) => {
      const description = label.description.toLowerCase();
      const confidence = label.score;

      Object.entries(styleKeywords).forEach(([style, keywords]) => {
        keywords.forEach((keyword) => {
          if (description.includes(keyword)) {
            styleScores[style as TattooStyle] += confidence;
          }
        });
      });
    });

    // 最も高いスコアのスタイルを返す
    const bestStyle = Object.entries(styleScores).reduce((a, b) =>
      styleScores[a[0] as TattooStyle] > styleScores[b[0] as TattooStyle]
        ? a
        : b,
    )[0] as TattooStyle;

    return bestStyle;
  }

  private analyzeColors(imageProperties: any): {
    dominantColors: string[];
    isColorful: boolean;
  } {
    if (!imageProperties?.dominantColors?.colors) {
      return { dominantColors: [], isColorful: false };
    }

    const colors = imageProperties.dominantColors.colors;
    const dominantColors: string[] = [];
    let colorVariance = 0;

    colors.slice(0, 5).forEach((colorData: any) => {
      const { red = 0, green = 0, blue = 0 } = colorData.color;
      const hex = `#${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
      dominantColors.push(hex);

      // 色の分散を計算（カラフルさの指標）
      const brightness = (red + green + blue) / 3;
      const variance =
        Math.pow(red - brightness, 2) +
        Math.pow(green - brightness, 2) +
        Math.pow(blue - brightness, 2);
      colorVariance += variance;
    });

    const isColorful = colorVariance > 10000 && dominantColors.length > 2;

    return { dominantColors, isColorful };
  }

  private analyzeMotifs(labels: any[], objects: any[]): string[] {
    const motifKeywords = {
      動物: [
        "animal",
        "dog",
        "cat",
        "bird",
        "lion",
        "tiger",
        "wolf",
        "eagle",
        "snake",
        "dragon",
      ],
      花: ["flower", "rose", "lotus", "cherry blossom", "sunflower", "lily"],
      人物: ["person", "face", "portrait", "woman", "man", "child"],
      自然: ["tree", "mountain", "ocean", "cloud", "sun", "moon", "star"],
      抽象: ["abstract", "geometric", "pattern", "mandala"],
      文字: ["text", "letter", "word", "script", "calligraphy"],
      記号: ["symbol", "sign", "cross", "heart", "arrow", "anchor"],
      宗教的: ["religious", "cross", "angel", "prayer", "sacred"],
      スカル: ["skull", "skeleton", "death", "bone"],
      機械: ["machine", "gear", "robot", "mechanical"],
    };

    const motifs: string[] = [];
    const allDescriptions = [
      ...labels.map((label) => label.description.toLowerCase()),
      ...objects.map((obj) => obj.name.toLowerCase()),
    ];

    Object.entries(motifKeywords).forEach(([motif, keywords]) => {
      const hasMotif = keywords.some((keyword) =>
        allDescriptions.some((desc) => desc.includes(keyword)),
      );

      if (hasMotif) {
        motifs.push(motif);
      }
    });

    return motifs;
  }

  private analyzeComplexity(labels: any[]): "シンプル" | "中程度" | "複雑" {
    const complexityIndicators = {
      simple: ["simple", "minimal", "clean", "basic", "line"],
      complex: [
        "detailed",
        "intricate",
        "complex",
        "elaborate",
        "ornate",
        "decorative",
      ],
    };

    let simplicityScore = 0;
    let complexityScore = 0;

    labels.forEach((label) => {
      const description = label.description.toLowerCase();
      const confidence = label.score;

      complexityIndicators.simple.forEach((keyword) => {
        if (description.includes(keyword)) {
          simplicityScore += confidence;
        }
      });

      complexityIndicators.complex.forEach((keyword) => {
        if (description.includes(keyword)) {
          complexityScore += confidence;
        }
      });
    });

    // オブジェクトの数も複雑さの指標
    const objectCount = labels.length;
    if (objectCount > 15) complexityScore += 0.3;
    if (objectCount < 5) simplicityScore += 0.3;

    if (complexityScore > simplicityScore + 0.2) {
      return "複雑";
    } else if (simplicityScore > complexityScore + 0.2) {
      return "シンプル";
    } else {
      return "中程度";
    }
  }

  private calculateOverallConfidence(labels: any[]): number {
    if (labels.length === 0) return 0;

    const topLabels = labels.slice(0, 5);
    const averageConfidence =
      topLabels.reduce((sum, label) => sum + label.score, 0) / topLabels.length;

    return Math.round(averageConfidence * 100) / 100;
  }

  // 画像をBase64に変換するヘルパーメソッド
  async convertImageToBase64(imagePath: string): Promise<string> {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  }

  // タトゥー特化の分析結果を生成
  generateTattooAnalysis(analysis: AIAnalysisResult): {
    styleMatch: number;
    colorCompatibility: number;
    motifRelevance: number;
    overallScore: number;
  } {
    // スタイルマッチ度（信頼度ベース）
    const styleMatch = analysis.confidence;

    // 色の互換性（カラフルさとドミナントカラーの数）
    const colorCompatibility = analysis.isColorful
      ? Math.min(analysis.colorPalette.length / 5, 1)
      : 0.7; // モノクロームも価値がある

    // モチーフの関連性（検出されたモチーフ数）
    const motifRelevance = Math.min(analysis.motifs.length / 3, 1);

    // 総合スコア
    const overallScore =
      styleMatch * 0.4 + colorCompatibility * 0.3 + motifRelevance * 0.3;

    return {
      styleMatch: Math.round(styleMatch * 100) / 100,
      colorCompatibility: Math.round(colorCompatibility * 100) / 100,
      motifRelevance: Math.round(motifRelevance * 100) / 100,
      overallScore: Math.round(overallScore * 100) / 100,
    };
  }

  // セキュリティ関連のプライベートメソッド

  /**
   * 画像データのサニタイズ
   */
  private sanitizeImageData(imageBase64: string): string {
    // HTMLタグやスクリプトの除去
    const sanitized = imageBase64.replace(/<[^>]*>/g, "");

    // Base64データ形式の検証
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(sanitized)) {
      throw new Error("Invalid base64 image format");
    }

    return sanitized;
  }

  /**
   * API レスポンスの検証
   */
  private validateApiResponse(response: GoogleVisionResponse): void {
    if (
      !response ||
      !response.responses ||
      !Array.isArray(response.responses)
    ) {
      throw new Error("Invalid response format from Google Vision API");
    }
  }

  /**
   * API レスポンスのサニタイズ
   */
  private sanitizeApiResponse(
    response: GoogleVisionResponse,
  ): GoogleVisionResponse {
    const sanitized = JSON.parse(JSON.stringify(response));

    // レスポンス内の文字列をサニタイズ
    this.sanitizeObjectRecursively(sanitized);

    return sanitized;
  }

  /**
   * オブジェクトの再帰的サニタイズ
   */
  private sanitizeObjectRecursively(obj: any): void {
    if (typeof obj === "string") {
      // HTMLタグとスクリプトを除去
      return obj.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "");
    }

    if (typeof obj === "object" && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = this.sanitizeObjectRecursively(obj[key]);
        }
      }
    }

    return obj;
  }

  /**
   * セキュアなエラーハンドリング
   */
  private handleSecureError(error: any): void {
    // 本番環境ではセンシティブな情報をログに出力しない
    if (EnvironmentConfig.isProduction()) {
      // 本番環境では最小限のエラー情報のみ
      console.error("Vision API error occurred");
    } else {
      // 開発環境では詳細情報（ただしAPIキーは除外）
      const errorMessage = error?.message || "Unknown error";
      const sanitizedMessage = errorMessage.replace(
        /AIzaSy[a-zA-Z0-9_-]{35}/g,
        "[API_KEY_HIDDEN]",
      );
      console.error("Vision API error:", sanitizedMessage);
    }
  }
}

export default GoogleVisionService.getInstance();
