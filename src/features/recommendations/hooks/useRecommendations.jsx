import { mockRecommendations } from "../../../data/mockRecommendations";

export function useRecommendations() {
  return {
    recommendations: mockRecommendations
  };
}