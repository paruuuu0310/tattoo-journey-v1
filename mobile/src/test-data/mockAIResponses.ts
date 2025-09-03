import { AIAnalysisResult, TattooStyle } from "../types";

// Google Cloud Vision API のモックレスポンス
export const mockVisionAPIResponses = {
  // ミニマル・ライン作品の解析結果
  minimalLine: {
    responses: [
      {
        labelAnnotations: [
          { description: "Line art", score: 0.95, mid: "/m/line_art" },
          { description: "Minimalism", score: 0.92, mid: "/m/minimalism" },
          {
            description: "Black and white",
            score: 0.89,
            mid: "/m/black_white",
          },
          { description: "Geometric", score: 0.87, mid: "/m/geometric" },
          { description: "Simple", score: 0.85, mid: "/m/simple" },
        ],
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              {
                color: { red: 0, green: 0, blue: 0 },
                score: 0.8,
                pixelFraction: 0.3,
              },
              {
                color: { red: 255, green: 255, blue: 255 },
                score: 0.7,
                pixelFraction: 0.65,
              },
              {
                color: { red: 128, green: 128, blue: 128 },
                score: 0.2,
                pixelFraction: 0.05,
              },
            ],
          },
        },
      },
    ],
  },

  // 和彫り（桜）の解析結果
  japaneseSakura: {
    responses: [
      {
        labelAnnotations: [
          {
            description: "Cherry blossom",
            score: 0.94,
            mid: "/m/cherry_blossom",
          },
          { description: "Japanese art", score: 0.91, mid: "/m/japanese_art" },
          { description: "Traditional", score: 0.89, mid: "/m/traditional" },
          { description: "Flower", score: 0.87, mid: "/m/flower" },
          { description: "Black ink", score: 0.85, mid: "/m/black_ink" },
          { description: "Asian art", score: 0.83, mid: "/m/asian_art" },
        ],
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              {
                color: { red: 0, green: 0, blue: 0 },
                score: 0.6,
                pixelFraction: 0.4,
              },
              {
                color: { red: 40, green: 40, blue: 40 },
                score: 0.5,
                pixelFraction: 0.25,
              },
              {
                color: { red: 100, green: 100, blue: 100 },
                score: 0.4,
                pixelFraction: 0.2,
              },
              {
                color: { red: 255, green: 255, blue: 255 },
                score: 0.3,
                pixelFraction: 0.15,
              },
            ],
          },
        },
      },
    ],
  },

  // レタリング（スクリプト）の解析結果
  scriptLettering: {
    responses: [
      {
        labelAnnotations: [
          { description: "Text", score: 0.96, mid: "/m/text" },
          { description: "Script", score: 0.93, mid: "/m/script" },
          { description: "Calligraphy", score: 0.9, mid: "/m/calligraphy" },
          { description: "Lettering", score: 0.88, mid: "/m/lettering" },
          { description: "Typography", score: 0.85, mid: "/m/typography" },
          { description: "Cursive", score: 0.82, mid: "/m/cursive" },
        ],
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              {
                color: { red: 0, green: 0, blue: 0 },
                score: 0.85,
                pixelFraction: 0.35,
              },
              {
                color: { red: 255, green: 255, blue: 255 },
                score: 0.8,
                pixelFraction: 0.6,
              },
              {
                color: { red: 50, green: 50, blue: 50 },
                score: 0.3,
                pixelFraction: 0.05,
              },
            ],
          },
        },
      },
    ],
  },

  // カラフルなネオトラディショナル作品
  colorfulNeoTraditional: {
    responses: [
      {
        labelAnnotations: [
          { description: "Rose", score: 0.93, mid: "/m/rose" },
          { description: "Colorful", score: 0.91, mid: "/m/colorful" },
          {
            description: "Neo traditional",
            score: 0.89,
            mid: "/m/neo_traditional",
          },
          { description: "Flower", score: 0.87, mid: "/m/flower" },
          { description: "Vibrant", score: 0.85, mid: "/m/vibrant" },
          { description: "Bold lines", score: 0.83, mid: "/m/bold_lines" },
        ],
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              {
                color: { red: 220, green: 20, blue: 60 },
                score: 0.7,
                pixelFraction: 0.3,
              },
              {
                color: { red: 34, green: 139, blue: 34 },
                score: 0.6,
                pixelFraction: 0.25,
              },
              {
                color: { red: 255, green: 165, blue: 0 },
                score: 0.5,
                pixelFraction: 0.2,
              },
              {
                color: { red: 0, green: 0, blue: 0 },
                score: 0.4,
                pixelFraction: 0.15,
              },
              {
                color: { red: 255, green: 255, blue: 255 },
                score: 0.3,
                pixelFraction: 0.1,
              },
            ],
          },
        },
      },
    ],
  },

  // ジオメトリック・パターン
  geometricPattern: {
    responses: [
      {
        labelAnnotations: [
          { description: "Geometric", score: 0.95, mid: "/m/geometric" },
          { description: "Pattern", score: 0.92, mid: "/m/pattern" },
          { description: "Mandala", score: 0.88, mid: "/m/mandala" },
          {
            description: "Sacred geometry",
            score: 0.85,
            mid: "/m/sacred_geometry",
          },
          { description: "Symmetrical", score: 0.83, mid: "/m/symmetrical" },
          { description: "Dotwork", score: 0.8, mid: "/m/dotwork" },
        ],
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              {
                color: { red: 0, green: 0, blue: 0 },
                score: 0.9,
                pixelFraction: 0.45,
              },
              {
                color: { red: 255, green: 255, blue: 255 },
                score: 0.8,
                pixelFraction: 0.5,
              },
              {
                color: { red: 80, green: 80, blue: 80 },
                score: 0.3,
                pixelFraction: 0.05,
              },
            ],
          },
        },
      },
    ],
  },
};

// 期待されるAI解析結果
export const expectedAIAnalysis: Record<string, AIAnalysisResult> = {
  minimalLine: {
    style: "ミニマル",
    colorPalette: ["#000000", "#FFFFFF", "#808080"],
    isColorful: false,
    motifs: ["ライン", "ジオメトリック", "シンプル"],
    complexity: "シンプル",
    confidence: 0.92,
    rawLabels: [
      { description: "Line art", confidence: 0.95 },
      { description: "Minimalism", confidence: 0.92 },
      { description: "Black and white", confidence: 0.89 },
    ],
    processedAt: new Date(),
  },

  japaneseSakura: {
    style: "ジャパニーズ",
    colorPalette: ["#000000", "#282828", "#646464", "#FFFFFF"],
    isColorful: false,
    motifs: ["桜", "花", "和風", "トラディショナル"],
    complexity: "中程度",
    confidence: 0.91,
    rawLabels: [
      { description: "Cherry blossom", confidence: 0.94 },
      { description: "Japanese art", confidence: 0.91 },
      { description: "Traditional", confidence: 0.89 },
    ],
    processedAt: new Date(),
  },

  scriptLettering: {
    style: "レタリング",
    colorPalette: ["#000000", "#FFFFFF", "#323232"],
    isColorful: false,
    motifs: ["文字", "スクリプト", "カリグラフィー"],
    complexity: "シンプル",
    confidence: 0.93,
    rawLabels: [
      { description: "Text", confidence: 0.96 },
      { description: "Script", confidence: 0.93 },
      { description: "Calligraphy", confidence: 0.9 },
    ],
    processedAt: new Date(),
  },

  colorfulNeoTraditional: {
    style: "ネオトラディショナル",
    colorPalette: ["#DC143C", "#228B22", "#FFA500", "#000000", "#FFFFFF"],
    isColorful: true,
    motifs: ["薔薇", "花", "鮮やか", "ボールドライン"],
    complexity: "複雑",
    confidence: 0.89,
    rawLabels: [
      { description: "Rose", confidence: 0.93 },
      { description: "Colorful", confidence: 0.91 },
      { description: "Neo traditional", confidence: 0.89 },
    ],
    processedAt: new Date(),
  },

  geometricPattern: {
    style: "ジオメトリック",
    colorPalette: ["#000000", "#FFFFFF", "#505050"],
    isColorful: false,
    motifs: ["幾何学", "パターン", "マンダラ", "ドットワーク"],
    complexity: "複雑",
    confidence: 0.9,
    rawLabels: [
      { description: "Geometric", confidence: 0.95 },
      { description: "Pattern", confidence: 0.92 },
      { description: "Mandala", confidence: 0.88 },
    ],
    processedAt: new Date(),
  },
};

// テスト用の画像データ（Base64エンコードされたダミーデータ）
export const testImageBase64 = {
  minimalLine:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  japaneseSakura:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  scriptLettering:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
};

export default {
  mockVisionAPIResponses,
  expectedAIAnalysis,
  testImageBase64,
};
