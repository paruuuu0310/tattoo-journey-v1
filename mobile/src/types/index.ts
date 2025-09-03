export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  userType: UserType;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile;
}

export type UserType = "customer" | "artist" | "owner";

export interface UserProfile {
  firstName: string;
  lastName: string;
  bio?: string;
  location: Location;
  phone?: string;
  preferences?: UserPreferences;
}

export interface Location {
  address: string;
  city: string;
  prefecture: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface UserPreferences {
  maxDistance: number; // km
  budgetMin: number;
  budgetMax: number;
  preferredStyles: TattooStyle[];
}

export interface Artist extends User {
  profile: ArtistProfile;
  portfolio: PortfolioItem[];
  ratings: ArtistRating;
  availability: AvailabilitySlot[];
}

export interface ArtistProfile extends UserProfile {
  studioName?: string;
  experienceYears: number;
  specialties: TattooStyle[];
  hourlyRate: number;
  minimumRate: number;
  instagram?: string;
  website?: string;
  certifications: string[];
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  style: TattooStyle;
  size: TattooSize;
  duration: number; // hours
  price: number;
  tags: string[];
  aiAnalysis: AIAnalysis;
  createdAt: Date;
}

export interface AIAnalysis {
  style: TattooStyle;
  colorPalette: string[];
  isColorful: boolean;
  motifs: string[];
  complexity: "シンプル" | "中程度" | "複雑";
  confidence: number;
}

export interface AIAnalysisResult extends AIAnalysis {
  rawLabels: Array<{
    description: string;
    confidence: number;
  }>;
  processedAt: Date;
}

export interface ImageAnalysis {
  dominantColors: string[];
  isColorful: boolean;
  detectedObjects: string[];
  confidence: number;
}

export interface StyleScore {
  style: TattooStyle;
  confidence: number;
}

export interface ColorAnalysis {
  isColorful: boolean;
  dominantColors: string[];
  colorPalette: string[];
}

export type TattooStyle =
  | "リアリズム"
  | "トラディショナル"
  | "ネオトラディショナル"
  | "ジャパニーズ"
  | "ブラック＆グレー"
  | "カラー"
  | "ジオメトリック"
  | "ミニマル"
  | "トライバル"
  | "バイオメカニクス"
  | "オールドスクール"
  | "レタリング"
  | "ポートレート";

export type TattooSize = "small" | "medium" | "large" | "extra-large";

export interface ArtistRating {
  averageRating: number;
  totalReviews: number;
  skillRating: number;
  communicationRating: number;
  professionalismRating: number;
}

export interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface MatchingRequest {
  customerId: string;
  referenceImages: string[];
  desiredStyle?: TattooStyle;
  size: TattooSize;
  budget: {
    min: number;
    max: number;
  };
  location: Location;
  maxDistance: number;
  description?: string;
  aiAnalysis: AIAnalysis;
}

export interface MatchingResult {
  artist: Artist;
  matchScore: number;
  reasons: MatchReason[];
  estimatedPrice: number;
  distance: number;
}

export interface MatchReason {
  factor: "style" | "rating" | "price" | "distance" | "availability";
  score: number;
  explanation: string;
}

export interface Review {
  id: string;
  bookingId: string;
  artistId: string;
  customerId: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}
