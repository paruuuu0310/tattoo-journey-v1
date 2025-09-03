// テストユーザーデータ（お客様）
export const testCustomer = {
  uid: "test-customer-001",
  email: "test.customer@example.com",
  displayName: "田中太郎",
  photoURL: "https://via.placeholder.com/150/4CAF50/FFFFFF?text=Customer",
  userType: "customer",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
  profile: {
    firstName: "太郎",
    lastName: "田中",
    bio: "タトゥーに興味がある会社員です。初めてのタトゥーを検討中です。",
    location: {
      address: "東京都渋谷区渋谷1-1-1",
      city: "渋谷区",
      prefecture: "東京都",
      postalCode: "150-0002",
      latitude: 35.658581,
      longitude: 139.701486,
    },
    phone: "090-1234-5678",
    preferences: {
      maxDistance: 20, // 20km以内
      budgetMin: 30000,
      budgetMax: 100000,
      preferredStyles: ["ミニマル", "ブラック＆グレー", "レタリング"],
    },
  },
};
// テストアーティストデータ
export const testArtist = {
  uid: "test-artist-001",
  email: "test.artist@example.com",
  displayName: "鈴木美咲",
  photoURL: "https://via.placeholder.com/150/FF6B6B/FFFFFF?text=Artist",
  userType: "artist",
  createdAt: new Date("2023-06-01"),
  updatedAt: new Date(),
  profile: {
    firstName: "美咲",
    lastName: "鈴木",
    bio: "10年以上の経験を持つタトゥーアーティストです。繊細なライン作品と和彫りが得意です。お客様一人ひとりに合わせたデザインを心がけています。",
    location: {
      address: "東京都新宿区歌舞伎町2-10-5",
      city: "新宿区",
      prefecture: "東京都",
      postalCode: "160-0021",
      latitude: 35.694003,
      longitude: 139.703531,
    },
    phone: "03-1234-5678",
    studioName: "Ink & Soul Studio Tokyo",
    experienceYears: 12,
    specialties: ["ジャパニーズ", "ブラック＆グレー", "ミニマル", "レタリング"],
    hourlyRate: 15000,
    minimumRate: 25000,
    instagram: "@ink_soul_tokyo",
    website: "https://ink-soul-tokyo.com",
    certifications: [
      "日本タトゥー協会認定アーティスト",
      "衛生管理者資格",
      "First Aid 認定",
    ],
  },
  portfolio: [], // 下記で設定
  ratings: {
    averageRating: 4.8,
    totalReviews: 127,
    skillRating: 4.9,
    communicationRating: 4.7,
    professionalismRating: 4.8,
  },
  availability: [
    {
      date: new Date("2024-09-01"),
      startTime: "10:00",
      endTime: "18:00",
      isBooked: false,
    },
    {
      date: new Date("2024-09-02"),
      startTime: "12:00",
      endTime: "20:00",
      isBooked: false,
    },
    {
      date: new Date("2024-09-03"),
      startTime: "10:00",
      endTime: "16:00",
      isBooked: true,
    },
  ],
};
// テストポートフォリオデータ
export const testPortfolioItems = [
  {
    id: "portfolio-001",
    imageUrl:
      "https://via.placeholder.com/400x400/333333/FFFFFF?text=Japanese+Dragon",
    title: "龍の和彫り（背中）",
    description:
      "伝統的な龍のデザインを現代的にアレンジした大作です。3セッションで完成させました。",
    style: "ジャパニーズ",
    size: "extra-large",
    duration: 18, // 18時間（3セッション × 6時間）
    price: 300000,
    tags: ["龍", "和彫り", "背中", "大作", "ブラック＆グレー"],
    aiAnalysis: {
      style: "ジャパニーズ",
      colorPalette: ["#000000", "#333333", "#666666", "#999999"],
      isColorful: false,
      motifs: ["龍", "雲", "波", "鱗"],
      complexity: "複雑",
      confidence: 0.95,
    },
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "portfolio-002",
    imageUrl:
      "https://via.placeholder.com/400x400/222222/FFFFFF?text=Minimalist+Line",
    title: "ミニマル・ライン（手首）",
    description:
      "繊細なラインワークで表現したミニマルデザイン。初回のお客様にも人気です。",
    style: "ミニマル",
    size: "small",
    duration: 2,
    price: 35000,
    tags: ["ミニマル", "手首", "ライン", "シンプル", "初心者向け"],
    aiAnalysis: {
      style: "ミニマル",
      colorPalette: ["#000000"],
      isColorful: false,
      motifs: ["幾何学", "ライン"],
      complexity: "シンプル",
      confidence: 0.92,
    },
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "portfolio-003",
    imageUrl:
      "https://via.placeholder.com/400x400/444444/FFFFFF?text=Script+Lettering",
    title: "スクリプト・レタリング（胸）",
    description: "筆記体での文字入れ。フォントとサイズにこだわった作品です。",
    style: "レタリング",
    size: "medium",
    duration: 4,
    price: 60000,
    tags: ["レタリング", "胸", "筆記体", "文字", "スクリプト"],
    aiAnalysis: {
      style: "レタリング",
      colorPalette: ["#000000", "#222222"],
      isColorful: false,
      motifs: ["文字", "スクリプト"],
      complexity: "中程度",
      confidence: 0.88,
    },
    createdAt: new Date("2024-03-10"),
  },
  {
    id: "portfolio-004",
    imageUrl:
      "https://via.placeholder.com/400x400/111111/FFFFFF?text=Geometric+Design",
    title: "幾何学模様（腕）",
    description:
      "精密な幾何学パターンとドットワーク。数学的美しさを追求しました。",
    style: "ジオメトリック",
    size: "large",
    duration: 8,
    price: 120000,
    tags: ["ジオメトリック", "腕", "幾何学", "ドットワーク", "パターン"],
    aiAnalysis: {
      style: "ジオメトリック",
      colorPalette: ["#000000", "#333333"],
      isColorful: false,
      motifs: ["幾何学", "ドット", "パターン"],
      complexity: "複雑",
      confidence: 0.94,
    },
    createdAt: new Date("2024-04-05"),
  },
  {
    id: "portfolio-005",
    imageUrl: "https://via.placeholder.com/400x400/555555/FFFFFF?text=Rose+BG",
    title: "リアリスティック・ローズ（肩）",
    description:
      "ブラック＆グレーで表現したリアルな薔薇。陰影と質感にこだわりました。",
    style: "ブラック＆グレー",
    size: "medium",
    duration: 6,
    price: 90000,
    tags: ["薔薇", "リアリズム", "ブラック＆グレー", "肩", "陰影"],
    aiAnalysis: {
      style: "ブラック＆グレー",
      colorPalette: ["#000000", "#333333", "#666666", "#999999", "#CCCCCC"],
      isColorful: false,
      motifs: ["薔薇", "花", "葉"],
      complexity: "複雑",
      confidence: 0.91,
    },
    createdAt: new Date("2024-05-12"),
  },
];
// ポートフォリオをアーティストデータに追加
testArtist.portfolio = testPortfolioItems;
// その他のテストアーティスト（競合他社として）
export const competitorArtists = [
  {
    ...testArtist,
    uid: "test-artist-002",
    email: "competitor2@example.com",
    displayName: "佐藤健一",
    profile: {
      ...testArtist.profile,
      firstName: "健一",
      lastName: "佐藤",
      studioName: "Urban Ink Tokyo",
      specialties: ["トラディショナル", "オールドスクール"],
      hourlyRate: 12000,
      location: {
        ...testArtist.profile.location,
        address: "東京都六本木6-6-6",
        latitude: 35.665498,
        longitude: 139.731293,
      },
    },
    ratings: {
      averageRating: 4.5,
      totalReviews: 89,
      skillRating: 4.6,
      communicationRating: 4.3,
      professionalismRating: 4.6,
    },
  },
  {
    ...testArtist,
    uid: "test-artist-003",
    email: "competitor3@example.com",
    displayName: "山田花子",
    profile: {
      ...testArtist.profile,
      firstName: "花子",
      lastName: "山田",
      studioName: "Flower Tattoo Studio",
      specialties: ["カラー", "ネオトラディショナル"],
      hourlyRate: 18000,
      location: {
        ...testArtist.profile.location,
        address: "東京都表参道3-3-3",
        latitude: 35.665074,
        longitude: 139.712531,
      },
    },
    ratings: {
      averageRating: 4.3,
      totalReviews: 64,
      skillRating: 4.4,
      communicationRating: 4.1,
      professionalismRating: 4.4,
    },
  },
];
// テスト用のサンプル画像データ（お客様がアップロードする参考画像）
export const testReferenceImages = [
  {
    id: "ref-img-001",
    uri: "https://via.placeholder.com/300x300/000000/FFFFFF?text=Minimal+Line+Art",
    description: "ミニマルなライン作品の参考画像",
    expectedStyle: "ミニマル",
  },
  {
    id: "ref-img-002",
    uri: "https://via.placeholder.com/300x300/333333/FFFFFF?text=Japanese+Cherry",
    description: "桜の和彫り参考画像",
    expectedStyle: "ジャパニーズ",
  },
  {
    id: "ref-img-003",
    uri: "https://via.placeholder.com/300x300/222222/FFFFFF?text=Script+Text",
    description: "スクリプト文字の参考画像",
    expectedStyle: "レタリング",
  },
];
// テスト用メッセージデータ
export const testMessages = [
  {
    id: "msg-001",
    text: "はじめまして！ポートフォリオを拝見させていただき、ぜひお願いしたいと思いました。",
    senderId: testCustomer.uid,
    timestamp: new Date("2024-08-20T10:00:00"),
    type: "text",
  },
  {
    id: "msg-002",
    text: "ありがとうございます！どのようなデザインをお考えでしょうか？",
    senderId: testArtist.uid,
    timestamp: new Date("2024-08-20T10:30:00"),
    type: "text",
  },
  {
    id: "msg-003",
    text: "手首にミニマルなラインのタトゥーを入れたいと考えています。予算は5万円程度を想定しています。",
    senderId: testCustomer.uid,
    timestamp: new Date("2024-08-20T11:00:00"),
    type: "text",
  },
];
// テスト用レビューデータ
export const testReviews = [
  {
    id: "review-001",
    artistId: testArtist.uid,
    customerId: testCustomer.uid,
    rating: 5,
    categoryRatings: {
      technical: 5,
      communication: 4,
      cleanliness: 5,
      atmosphere: 5,
      value: 4,
    },
    comment:
      "初めてのタトゥーでしたが、丁寧な説明と技術で安心してお任せできました。仕上がりも想像以上で大満足です！",
    isAnonymous: false,
    hasImages: true,
    createdAt: new Date("2024-08-15"),
    helpful: 12,
    artistResponse: {
      comment:
        "この度はありがとうございました！初回ということで特に丁寧に対応させていただきました。気に入っていただけて嬉しいです！",
      createdAt: new Date("2024-08-16"),
    },
  },
];
export default {
  testCustomer,
  testArtist,
  competitorArtists,
  testPortfolioItems,
  testReferenceImages,
  testMessages,
  testReviews,
};
