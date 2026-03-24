/**
 * Photo moderation provider.
 *
 * In production, this would call an external service (AWS Rekognition, Google Cloud Vision, etc.)
 * to check photos for nudity, violence, or other policy violations.
 *
 * The stub always approves photos. Swap the implementation when you integrate a real service.
 */

export type ModerationResult = {
  approved: boolean;
  /** Reason for rejection, if any */
  reason?: string;
  /** Confidence score from the moderation service (0-1) */
  confidence?: number;
  /** Labels/categories detected */
  labels: string[];
};

export interface ModerationProvider {
  /** Check a photo URL/key for policy violations */
  checkPhoto(imageUrl: string): Promise<ModerationResult>;
}

class StubModerationProvider implements ModerationProvider {
  async checkPhoto(_imageUrl: string): Promise<ModerationResult> {
    // Stub: always approve. Replace with real implementation.
    return {
      approved: true,
      labels: [],
      confidence: 1.0,
    };
  }
}

let _provider: ModerationProvider = new StubModerationProvider();

export function getModerationProvider(): ModerationProvider {
  return _provider;
}

export function setModerationProvider(provider: ModerationProvider): void {
  _provider = provider;
}
