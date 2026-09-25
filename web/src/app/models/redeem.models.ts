export interface RedeemCode {
  id: string; // The transaction number ($code)
  amount: number;
  isRedeemed: boolean;
  donatedAt?: string;
  createdAt: string;
  createdBy: string;
  redeemedBy?: string; // User UID
  redeemedEmail?: string;
  redeemedAt?: string;
  donationId?: string; // Public donation push ID
}
