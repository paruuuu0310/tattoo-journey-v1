/**
 * Scoring Functions - Tattoo Journey 2.0
 * Firebase Functions for artist scoring and matching algorithms
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Generate matching score between customer request and artist
 */
export const generateMatchingScore = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { customerRequest, artistId } = data;

    if (!customerRequest || !artistId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Customer request and artist ID are required",
      );
    }

    try {
      // Get artist data
      const artistDoc = await db.collection("users").doc(artistId).get();

      if (!artistDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Artist not found");
      }

      const artistData = artistDoc.data()!;

      // Calculate individual scores
      const designScore = calculateDesignScore(
        customerRequest.imageAnalysis,
        artistData.portfolio,
      );
      const experienceScore = calculateArtistExperienceScore(artistData);
      const priceScore = calculatePriceScore(
        customerRequest.budget,
        artistData.pricing,
      );
      const locationScore = calculateLocationScore(
        customerRequest.location,
        artistData.location,
      );

      // Weighted total score (Design 40% + Artist 30% + Price 20% + Distance 10%)
      const totalScore =
        designScore * 0.4 +
        experienceScore * 0.3 +
        priceScore * 0.2 +
        locationScore * 0.1;

      const matchingResult = {
        artistId,
        totalScore: Math.round(totalScore * 100) / 100,
        breakdown: {
          design: Math.round(designScore * 100) / 100,
          experience: Math.round(experienceScore * 100) / 100,
          price: Math.round(priceScore * 100) / 100,
          location: Math.round(locationScore * 100) / 100,
        },
        timestamp: Date.now(),
      };

      // Store matching score
      await db.collection("matchingScores").add({
        customerId: context.auth.uid,
        ...matchingResult,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        matchingScore: matchingResult,
      };
    } catch (error) {
      console.error("Error generating matching score:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate matching score",
      );
    }
  },
);

/**
 * Update artist overall score based on reviews and performance
 */
export const updateArtistScore = functions.firestore
  .document("reviews/{reviewId}")
  .onWrite(async (change, context) => {
    const reviewData = change.after.exists ? change.after.data() : null;

    if (!reviewData) {
      return; // Review deleted
    }

    try {
      const artistId = reviewData.artistId;

      // Get all reviews for this artist
      const reviewsSnapshot = await db
        .collection("reviews")
        .where("artistId", "==", artistId)
        .get();

      let totalRating = 0;
      let totalReviews = 0;
      let categoryScores = {
        quality: 0,
        professionalism: 0,
        communication: 0,
        cleanliness: 0,
        value: 0,
      };

      reviewsSnapshot.docs.forEach((doc) => {
        const review = doc.data();
        totalRating += review.overallRating || 0;
        totalReviews++;

        // Accumulate category scores
        if (review.categoryRatings) {
          Object.keys(categoryScores).forEach((category) => {
            categoryScores[category as keyof typeof categoryScores] +=
              review.categoryRatings[category] || 0;
          });
        }
      });

      // Calculate averages
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      const averageCategoryScores = Object.keys(categoryScores).reduce(
        (acc, category) => {
          acc[category] =
            totalReviews > 0
              ? categoryScores[category as keyof typeof categoryScores] /
                totalReviews
              : 0;
          return acc;
        },
        {} as any,
      );

      // Calculate experience bonus
      const artistDoc = await db.collection("users").doc(artistId).get();
      const artistData = artistDoc.data();
      const experienceYears = artistData?.experience?.years || 0;
      const experienceBonus = Math.min(experienceYears * 0.05, 0.5); // Max 0.5 bonus

      // Calculate completion rate bonus
      const completedBookings = artistData?.stats?.completedBookings || 0;
      const totalBookings = artistData?.stats?.totalBookings || 1;
      const completionRate = completedBookings / totalBookings;
      const completionBonus = completionRate * 0.3;

      // Calculate final artist score
      const artistScore = Math.min(
        averageRating + experienceBonus + completionBonus,
        5.0,
      );

      // Update artist document
      await db
        .collection("users")
        .doc(artistId)
        .update({
          "reviews.averageRating": Math.round(averageRating * 10) / 10,
          "reviews.totalReviews": totalReviews,
          "reviews.categoryAverages": averageCategoryScores,
          artistScore: Math.round(artistScore * 10) / 10,
          lastScoreUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log("Artist score updated:", {
        artistId,
        averageRating,
        totalReviews,
        artistScore,
      });
    } catch (error) {
      console.error("Error updating artist score:", error);
    }
  });

/**
 * Calculate design similarity score
 */
function calculateDesignScore(
  customerAnalysis: any,
  artistPortfolio: any[],
): number {
  if (!artistPortfolio || artistPortfolio.length === 0) {
    return 0.3; // Default score for new artists
  }

  let totalSimilarity = 0;
  let comparisons = 0;

  // Compare with artist's portfolio
  artistPortfolio.forEach((portfolioItem) => {
    if (portfolioItem.analysis) {
      let similarity = 0;

      // Style similarity
      if (
        customerAnalysis.style.category ===
        portfolioItem.analysis.style.category
      ) {
        similarity += 0.4;
      }

      // Color palette similarity
      const colorSimilarity = calculateColorSimilarity(
        customerAnalysis.colors,
        portfolioItem.analysis.colors,
      );
      similarity += colorSimilarity * 0.3;

      // Complexity similarity
      if (customerAnalysis.complexity === portfolioItem.analysis.complexity) {
        similarity += 0.3;
      }

      totalSimilarity += similarity;
      comparisons++;
    }
  });

  return comparisons > 0 ? totalSimilarity / comparisons : 0.3;
}

/**
 * Calculate artist experience score
 */
function calculateArtistExperienceScore(artistData: any): number {
  const experienceYears = artistData.experience?.years || 0;
  const averageRating = artistData.reviews?.averageRating || 0;
  const totalReviews = artistData.reviews?.totalReviews || 0;
  const completionRate = artistData.stats?.completionRate || 0;

  // Experience component (0-1)
  const experienceScore = Math.min(experienceYears / 10, 1);

  // Rating component (0-1)
  const ratingScore = averageRating / 5;

  // Review count component (0-1)
  const reviewCountScore = Math.min(totalReviews / 20, 1);

  // Completion rate component (0-1)
  const completionScore = completionRate;

  // Weighted combination
  return (
    experienceScore * 0.3 +
    ratingScore * 0.4 +
    reviewCountScore * 0.2 +
    completionScore * 0.1
  );
}

/**
 * Calculate price compatibility score
 */
function calculatePriceScore(
  customerBudget: number,
  artistPricing: any,
): number {
  if (!customerBudget || !artistPricing) {
    return 0.5; // Default score
  }

  const artistAvgPrice =
    artistPricing.averagePrice ||
    artistPricing.hourlyRate * artistPricing.averageSessionHours ||
    artistPricing.basePrice ||
    0;

  if (artistAvgPrice === 0) {
    return 0.5;
  }

  const ratio = customerBudget / artistAvgPrice;

  // Score based on budget ratio
  if (ratio >= 1.5) return 1.0; // Customer budget is 150%+ of artist price
  if (ratio >= 1.2) return 0.9; // 120-149%
  if (ratio >= 1.0) return 0.8; // 100-119% - perfect match
  if (ratio >= 0.8) return 0.6; // 80-99% - still reasonable
  if (ratio >= 0.6) return 0.3; // 60-79% - challenging
  return 0.1; // Under 60% - likely too expensive
}

/**
 * Calculate location proximity score
 */
function calculateLocationScore(
  customerLocation: any,
  artistLocation: any,
): number {
  if (!customerLocation || !artistLocation) {
    return 0.5; // Default score when location not available
  }

  const distance = calculateHaversineDistance(
    customerLocation.latitude,
    customerLocation.longitude,
    artistLocation.latitude,
    artistLocation.longitude,
  );

  // Score based on distance (in km)
  if (distance <= 5) return 1.0; // Within 5km
  if (distance <= 10) return 0.9; // 5-10km
  if (distance <= 20) return 0.8; // 10-20km
  if (distance <= 50) return 0.6; // 20-50km
  if (distance <= 100) return 0.4; // 50-100km
  if (distance <= 200) return 0.2; // 100-200km
  return 0.1; // Over 200km
}

/**
 * Calculate color palette similarity
 */
function calculateColorSimilarity(colors1: any[], colors2: any[]): number {
  if (!colors1 || !colors2 || colors1.length === 0 || colors2.length === 0) {
    return 0.5;
  }

  let similarity = 0;
  const maxComparisons = Math.min(colors1.length, colors2.length, 3);

  for (let i = 0; i < maxComparisons; i++) {
    const color1 = colors1[i];
    const color2 = colors2[i];

    if (color1 && color2) {
      const colorDistance = calculateColorDistance(color1.color, color2.color);
      similarity += Math.max(0, 1 - colorDistance / 442); // Max distance in RGB space
    }
  }

  return similarity / maxComparisons;
}

/**
 * Calculate distance between two colors in RGB space
 */
function calculateColorDistance(color1: string, color2: string): number {
  const rgb1 = extractRGB(color1);
  const rgb2 = extractRGB(color2);

  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2),
  );
}

/**
 * Extract RGB values from color string
 */
function extractRGB(colorString: string): { r: number; g: number; b: number } {
  const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
