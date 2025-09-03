/**
 * AI Matching Functions - Tattoo Journey 2.0
 * Firebase Functions for AI-powered artist matching and image analysis
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import vision from "@google-cloud/vision";

const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();

interface ImageAnalysisResult {
  labels: Array<{ description: string; score: number }>;
  objects: Array<{ name: string; confidence: number }>;
  colors: Array<{ color: string; percentage: number }>;
  style: {
    category: string;
    confidence: number;
  };
  complexity: "simple" | "medium" | "complex";
}

/**
 * Process Image Analysis using Google Cloud Vision API
 */
export const processImageAnalysis = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { imageUrl, userId } = data;

    if (!imageUrl) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Image URL is required",
      );
    }

    try {
      // Analyze image with Google Cloud Vision
      const [result] = await visionClient.annotateImage({
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: "LABEL_DETECTION", maxResults: 20 },
          { type: "OBJECT_LOCALIZATION", maxResults: 10 },
          { type: "IMAGE_PROPERTIES" },
        ],
      });

      // Process Vision API results
      const analysisResult: ImageAnalysisResult = {
        labels:
          result.labelAnnotations?.map((label) => ({
            description: label.description || "",
            score: label.score || 0,
          })) || [],
        objects:
          result.localizedObjectAnnotations?.map((obj) => ({
            name: obj.name || "",
            confidence: obj.score || 0,
          })) || [],
        colors: extractDominantColors(result.imagePropertiesAnnotation),
        style: determineArtStyle(result.labelAnnotations || []),
        complexity: assessComplexity(result.labelAnnotations || []),
      };

      // Store analysis result
      await db.collection("imageAnalyses").add({
        userId,
        imageUrl,
        analysisResult,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processingTime: Date.now(),
      });

      return {
        success: true,
        analysis: analysisResult,
      };
    } catch (error) {
      console.error("Image analysis error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to analyze image",
      );
    }
  },
);

/**
 * Generate AI-powered Artist Matching
 */
export const generateAIMatching = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { imageAnalysis, customerLocation, budget, preferences } = data;

    try {
      // Get all active artists
      const artistsSnapshot = await db
        .collection("users")
        .where("userType", "==", "artist")
        .where("isActive", "==", true)
        .get();

      const matchingResults = [];

      for (const artistDoc of artistsSnapshot.docs) {
        const artistData = artistDoc.data();

        // Calculate matching scores
        const designScore = calculateDesignSimilarity(
          imageAnalysis,
          artistData.portfolio,
        );
        const locationScore = calculateLocationScore(
          customerLocation,
          artistData.location,
        );
        const priceScore = calculatePriceCompatibility(
          budget,
          artistData.pricing,
        );
        const experienceScore = calculateExperienceScore(
          artistData.experience,
          artistData.reviews,
        );

        // Weighted matching algorithm
        const totalScore =
          designScore * 0.4 +
          experienceScore * 0.3 +
          priceScore * 0.2 +
          locationScore * 0.1;

        if (totalScore > 0.3) {
          // Only include matches above threshold
          matchingResults.push({
            artistId: artistDoc.id,
            artistName: artistData.displayName,
            totalScore,
            breakdown: {
              design: designScore,
              experience: experienceScore,
              price: priceScore,
              location: locationScore,
            },
            portfolio: artistData.portfolio?.slice(0, 5) || [],
            specialties: artistData.specialties || [],
            averageRating: artistData.averageRating || 0,
            reviewCount: artistData.reviewCount || 0,
          });
        }
      }

      // Sort by total score
      matchingResults.sort((a, b) => b.totalScore - a.totalScore);

      // Store matching results
      await db.collection("matchingHistory").add({
        userId: context.auth.uid,
        imageAnalysis,
        matchingResults: matchingResults.slice(0, 10), // Top 10 matches
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        customerLocation,
        budget,
        preferences,
      });

      return {
        success: true,
        matches: matchingResults.slice(0, 10),
      };
    } catch (error) {
      console.error("AI matching error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate matches",
      );
    }
  },
);

/**
 * Helper Functions
 */

function extractDominantColors(
  imageProps: any,
): Array<{ color: string; percentage: number }> {
  if (!imageProps?.dominantColors?.colors) return [];

  return imageProps.dominantColors.colors.slice(0, 5).map((colorInfo: any) => ({
    color: `rgb(${colorInfo.color.red}, ${colorInfo.color.green}, ${colorInfo.color.blue})`,
    percentage: colorInfo.pixelFraction * 100,
  }));
}

function determineArtStyle(labels: any[]): {
  category: string;
  confidence: number;
} {
  const styleKeywords = {
    traditional: ["traditional", "classic", "vintage", "old school"],
    realistic: ["realistic", "portrait", "photographic", "detailed"],
    japanese: ["japanese", "oriental", "asian", "dragon", "cherry blossom"],
    tribal: ["tribal", "geometric", "pattern", "symbolic"],
    watercolor: ["watercolor", "artistic", "colorful", "abstract"],
    minimalist: ["simple", "minimal", "clean", "line art"],
  };

  let bestMatch = { category: "general", confidence: 0 };

  for (const [style, keywords] of Object.entries(styleKeywords)) {
    let styleScore = 0;

    labels.forEach((label) => {
      keywords.forEach((keyword) => {
        if (label.description?.toLowerCase().includes(keyword)) {
          styleScore += label.score || 0;
        }
      });
    });

    if (styleScore > bestMatch.confidence) {
      bestMatch = { category: style, confidence: styleScore };
    }
  }

  return bestMatch;
}

function assessComplexity(labels: any[]): "simple" | "medium" | "complex" {
  const complexityIndicators = labels.filter((label) =>
    ["detailed", "intricate", "complex", "elaborate"].includes(
      label.description?.toLowerCase() || "",
    ),
  );

  const objectCount = labels.length;

  if (complexityIndicators.length > 2 || objectCount > 15) {
    return "complex";
  } else if (complexityIndicators.length > 0 || objectCount > 8) {
    return "medium";
  }
  return "simple";
}

function calculateDesignSimilarity(
  customerAnalysis: any,
  artistPortfolio: any[],
): number {
  if (!artistPortfolio?.length) return 0;

  // Compare style, colors, complexity
  let totalSimilarity = 0;
  let comparisons = 0;

  artistPortfolio.forEach((portfolioItem) => {
    if (portfolioItem.analysis) {
      const styleSimilarity =
        customerAnalysis.style.category ===
        portfolioItem.analysis.style.category
          ? 0.8
          : 0.2;
      const complexitySimilarity =
        customerAnalysis.complexity === portfolioItem.analysis.complexity
          ? 0.6
          : 0.3;

      totalSimilarity += (styleSimilarity + complexitySimilarity) / 2;
      comparisons++;
    }
  });

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

function calculateLocationScore(
  customerLocation: any,
  artistLocation: any,
): number {
  if (!customerLocation || !artistLocation) return 0.5;

  // Calculate distance using Haversine formula
  const distance = calculateDistance(
    customerLocation.latitude,
    customerLocation.longitude,
    artistLocation.latitude,
    artistLocation.longitude,
  );

  // Score based on distance (0-100km range)
  if (distance <= 10) return 1.0;
  if (distance <= 25) return 0.8;
  if (distance <= 50) return 0.6;
  if (distance <= 100) return 0.4;
  return 0.2;
}

function calculatePriceCompatibility(
  customerBudget: number,
  artistPricing: any,
): number {
  if (!customerBudget || !artistPricing) return 0.5;

  const artistAvgPrice =
    artistPricing.averagePrice || artistPricing.hourlyRate * 3;

  const ratio = customerBudget / artistAvgPrice;

  if (ratio >= 1.2) return 1.0; // Customer can afford easily
  if (ratio >= 1.0) return 0.9; // Perfect match
  if (ratio >= 0.8) return 0.7; // Slight stretch
  if (ratio >= 0.6) return 0.4; // Significant stretch
  return 0.1; // Likely too expensive
}

function calculateExperienceScore(experience: any, reviews: any): number {
  const experienceYears = experience?.years || 0;
  const averageRating = reviews?.averageRating || 0;
  const reviewCount = reviews?.count || 0;

  const experienceScore = Math.min(experienceYears / 10, 1); // Max score at 10+ years
  const ratingScore = averageRating / 5; // 0-1 scale
  const reviewCountScore = Math.min(reviewCount / 50, 1); // Max score at 50+ reviews

  return experienceScore * 0.3 + ratingScore * 0.5 + reviewCountScore * 0.2;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
