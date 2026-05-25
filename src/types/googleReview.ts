export interface GoogleReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface GoogleReviewsPayload {
  rating: number;
  reviewCount: number;
  reviews: GoogleReview[];
  isPlaceholder: boolean;
  googleMapsUrl: string | null;
}
