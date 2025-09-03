// Mock data for Tattoo Journey app
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  userType: "customer" | "artist";
  preferences?: string[];
  location?: string;
  bio?: string;
}

export interface Artist {
  id: string;
  name: string;
  studioName?: string;
  avatar: string;
  coverImage: string;
  bio: string;
  specialties: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  location: string;
  priceRange: {
    small: number;
    medium: number;
    large: number;
  };
  portfolio: PortfolioItem[];
  availability: AvailabilitySlot[];
  isVerified: boolean;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  style: string;
  size: "small" | "medium" | "large";
  price: number;
  duration: number;
  description?: string;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Design {
  id: string;
  title: string;
  imageUrl: string;
  style: string;
  size: string;
  priceRange: string;
  artist: Artist;
  tags: string[];
  likes: number;
  isLiked: boolean;
}

export interface Booking {
  id: string;
  artistId: string;
  artistName: string;
  artistAvatar: string;
  designTitle: string;
  designImage: string;
  date: string;
  time: string;
  status:
    | "requested"
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no-show";
  price: number;
  duration: number;
  location: string;
}

export interface Review {
  id: string;
  bookingId: string;
  artistId: string;
  artistName: string;
  designTitle: string;
  designImage: string;
  rating: number;
  comment: string;
  photos: string[];
  date: string;
  isHelpful: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  type: "text" | "image" | "template";
  imageUrl?: string;
}

export interface ChatThread {
  id: string;
  artistId: string;
  artistName: string;
  artistAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface LegalDocument {
  id: string;
  title: string;
  type: "terms" | "privacy" | "guidelines";
  version: string;
  effectiveDate: string;
  isAgreed: boolean;
  content: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "ユイ",
    email: "yui@example.com",
    avatar: "https://i.pravatar.cc/100?img=1",
    userType: "customer",
    preferences: ["ミニマル", "植物", "幾何学"],
    location: "東京都渋谷区",
  },
  {
    id: "user-2",
    name: "カイ",
    email: "kai@example.com",
    avatar: "https://i.pravatar.cc/100?img=2",
    userType: "customer",
    preferences: ["リアリズム", "動物", "ブラック&グレー"],
    location: "大阪府大阪市",
  },
];

// Mock Artists
export const mockArtists: Artist[] = [
  {
    id: "artist-1",
    name: "TAKESHI",
    studioName: "Ink & Soul Studio",
    avatar: "https://i.pravatar.cc/100?img=10",
    coverImage: "https://picsum.photos/400/200?random=1",
    bio: "15年の経験を持つタトゥーアーティスト。ジャパニーズトラディショナルとリアリズムを得意とします。",
    specialties: ["ジャパニーズ", "リアリズム", "ブラック&グレー"],
    experienceYears: 15,
    rating: 4.8,
    reviewCount: 156,
    location: "東京都渋谷区",
    priceRange: {
      small: 15000,
      medium: 35000,
      large: 80000,
    },
    portfolio: [
      {
        id: "port-1",
        imageUrl: "https://picsum.photos/300/300?random=10",
        title: "龍の刺青",
        style: "ジャパニーズ",
        size: "large",
        price: 120000,
        duration: 8,
        description: "背中全体に広がる迫力ある龍のデザイン",
      },
      {
        id: "port-2",
        imageUrl: "https://picsum.photos/300/300?random=11",
        title: "ローズタトゥー",
        style: "リアリズム",
        size: "medium",
        price: 45000,
        duration: 4,
      },
    ],
    availability: [
      {
        id: "slot-1",
        date: "2025-09-01",
        startTime: "10:00",
        endTime: "14:00",
        isBooked: false,
      },
      {
        id: "slot-2",
        date: "2025-09-02",
        startTime: "15:00",
        endTime: "18:00",
        isBooked: true,
      },
    ],
    isVerified: true,
  },
  {
    id: "artist-2",
    name: "YUKI",
    studioName: "Minimalist Ink",
    avatar: "https://i.pravatar.cc/100?img=11",
    coverImage: "https://picsum.photos/400/200?random=2",
    bio: "ミニマルで繊細なデザインを専門とするアーティスト。植物や幾何学模様が得意です。",
    specialties: ["ミニマル", "植物", "幾何学"],
    experienceYears: 8,
    rating: 4.9,
    reviewCount: 89,
    location: "東京都新宿区",
    priceRange: {
      small: 12000,
      medium: 25000,
      large: 50000,
    },
    portfolio: [
      {
        id: "port-3",
        imageUrl: "https://picsum.photos/300/300?random=12",
        title: "ミニマル葉っぱ",
        style: "ミニマル",
        size: "small",
        price: 15000,
        duration: 2,
      },
    ],
    availability: [],
    isVerified: true,
  },
];

// Mock Designs
export const mockDesigns: Design[] = [
  {
    id: "design-1",
    title: "龍の刺青",
    imageUrl: "https://picsum.photos/300/400?random=20",
    style: "ジャパニーズ",
    size: "Large",
    priceRange: "¥80,000 - ¥150,000",
    artist: mockArtists[0]!,
    tags: ["龍", "背中", "ブラック"],
    likes: 245,
    isLiked: false,
  },
  {
    id: "design-2",
    title: "ミニマル植物",
    imageUrl: "https://picsum.photos/300/400?random=21",
    style: "ミニマル",
    size: "Small",
    priceRange: "¥12,000 - ¥20,000",
    artist: mockArtists[1]!,
    tags: ["植物", "腕", "ライン"],
    likes: 128,
    isLiked: true,
  },
  {
    id: "design-3",
    title: "リアルローズ",
    imageUrl: "https://picsum.photos/300/400?random=22",
    style: "リアリズム",
    size: "Medium",
    priceRange: "¥35,000 - ¥60,000",
    artist: mockArtists[0]!,
    tags: ["薔薇", "肩", "カラー"],
    likes: 189,
    isLiked: false,
  },
  {
    id: "design-4",
    title: "幾何学パターン",
    imageUrl: "https://picsum.photos/300/400?random=23",
    style: "幾何学",
    size: "Medium",
    priceRange: "¥25,000 - ¥45,000",
    artist: mockArtists[1]!,
    tags: ["幾何学", "腕", "ブラック"],
    likes: 156,
    isLiked: true,
  },
];

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: "booking-1",
    artistId: "artist-1",
    artistName: "TAKESHI",
    artistAvatar: "https://i.pravatar.cc/100?img=10",
    designTitle: "ローズタトゥー",
    designImage: "https://picsum.photos/100/100?random=30",
    date: "2025-09-15",
    time: "14:00",
    status: "confirmed",
    price: 45000,
    duration: 4,
    location: "Ink & Soul Studio",
  },
  {
    id: "booking-2",
    artistId: "artist-2",
    artistName: "YUKI",
    artistAvatar: "https://i.pravatar.cc/100?img=11",
    designTitle: "ミニマル植物",
    designImage: "https://picsum.photos/100/100?random=31",
    date: "2025-08-20",
    time: "10:00",
    status: "completed",
    price: 15000,
    duration: 2,
    location: "Minimalist Ink",
  },
  {
    id: "booking-3",
    artistId: "artist-1",
    artistName: "TAKESHI",
    artistAvatar: "https://i.pravatar.cc/100?img=10",
    designTitle: "小さな星",
    designImage: "https://picsum.photos/100/100?random=32",
    date: "2025-09-01",
    time: "16:00",
    status: "pending",
    price: 18000,
    duration: 2,
    location: "Ink & Soul Studio",
  },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: "review-1",
    bookingId: "booking-2",
    artistId: "artist-2",
    artistName: "YUKI",
    designTitle: "ミニマル植物",
    designImage: "https://picsum.photos/100/100?random=31",
    rating: 5,
    comment:
      "期待以上の仕上がりでした！丁寧な説明とアフターケアも素晴らしかったです。",
    photos: [
      "https://picsum.photos/200/200?random=40",
      "https://picsum.photos/200/200?random=41",
    ],
    date: "2025-08-21",
    isHelpful: true,
  },
];

// Mock Chat Threads
export const mockChatThreads: ChatThread[] = [
  {
    id: "thread-1",
    artistId: "artist-1",
    artistName: "TAKESHI",
    artistAvatar: "https://i.pravatar.cc/100?img=10",
    lastMessage: "来週の予約の件でご相談があります",
    lastMessageTime: "14:30",
    unreadCount: 2,
    messages: [
      {
        id: "msg-1",
        senderId: "user-1",
        senderName: "ユイ",
        senderAvatar: "https://i.pravatar.cc/100?img=1",
        message: "こんにちは！ローズのタトゥーについて相談したいです",
        timestamp: "14:25",
        type: "text",
      },
      {
        id: "msg-2",
        senderId: "artist-1",
        senderName: "TAKESHI",
        senderAvatar: "https://i.pravatar.cc/100?img=10",
        message: "こんにちは！どのようなデザインをお考えでしょうか？",
        timestamp: "14:27",
        type: "text",
      },
      {
        id: "msg-3",
        senderId: "user-1",
        senderName: "ユイ",
        senderAvatar: "https://i.pravatar.cc/100?img=1",
        message: "来週の予約の件でご相談があります",
        timestamp: "14:30",
        type: "text",
      },
    ],
  },
];

// Mock Legal Documents
export const mockLegalDocuments: LegalDocument[] = [
  {
    id: "legal-1",
    title: "利用規約",
    type: "terms",
    version: "2.1.0",
    effectiveDate: "2025-01-15",
    isAgreed: true,
    content: `# 利用規約

## 第1条（適用範囲）
本規約は、当社が提供するTattoo Journeyサービスの利用に関して適用されます。

## 第2条（利用者の義務）
利用者は以下の義務を負います：
- サービスを適切に利用すること
- 他の利用者に迷惑をかけないこと
- 法令を遵守すること

## 第3条（禁止事項）
以下の行為を禁止します：
- 不正利用
- 営業妨害
- その他当社が不適切と判断する行為`,
  },
  {
    id: "legal-2",
    title: "プライバシーポリシー",
    type: "privacy",
    version: "1.8.0",
    effectiveDate: "2025-01-10",
    isAgreed: true,
    content: `# プライバシーポリシー

## 収集する情報
当社は以下の情報を収集します：
- 基本プロフィール情報
- 利用履歴
- デバイス情報

## 情報の利用目的
収集した情報は以下の目的で利用します：
- サービスの提供・改善
- カスタマーサポート
- マーケティング活動`,
  },
  {
    id: "legal-3",
    title: "コミュニティガイドライン",
    type: "guidelines",
    version: "1.2.0",
    effectiveDate: "2025-01-01",
    isAgreed: false,
    content: `# コミュニティガイドライン

## 基本方針
Tattoo Journeyは、安全で包括的なコミュニティを目指しています。

## 投稿に関するルール
- 適切な内容の投稿
- 他者への敬意を持った発言
- プライバシーの保護

## 違反時の対応
ガイドライン違反があった場合、以下の措置を取る場合があります：
- 警告
- 一時停止
- アカウント削除`,
  },
];

// Onboarding Tags
export const mockOnboardingTags = [
  "白インク",
  "ミニマル",
  "腕",
  "植物",
  "幾何学",
  "リアリズム",
  "ジャパニーズ",
  "ブラック&グレー",
  "カラー",
  "動物",
  "文字",
  "背中",
  "肩",
  "手首",
  "足首",
  "トライバル",
  "オールドスクール",
];

// Template messages for chat
export const mockTemplateMessages = [
  "料金について教えてください",
  "デザインの相談をしたいです",
  "予約の空き状況はいかがですか？",
  "アフターケアについて質問があります",
  "サイズの変更は可能ですか？",
];

// Current user (for demo)
export const currentUser: User = mockUsers[0]!;
