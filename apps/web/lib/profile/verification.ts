export type UserVerificationInput = {
  hasVerifiedTwitterProfile: boolean;
  hasVerifiedStripeIdentity: boolean;
};

export function isUserVerified(input: UserVerificationInput): boolean {
  return input.hasVerifiedTwitterProfile && input.hasVerifiedStripeIdentity;
}
