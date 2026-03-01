export type PurchaseCheckoutOwnedResponse = {
  flow: "owned";
  purchaseId: string;
};

export type PurchaseCheckoutFreeResponse = {
  flow: "free";
  purchaseId: string;
};

export type PurchaseCheckoutPaidResponse = {
  flow: "paid";
  purchaseId: string;
  checkoutUrl: string;
};

export type CreatePurchaseCheckoutResponse =
  | PurchaseCheckoutOwnedResponse
  | PurchaseCheckoutFreeResponse
  | PurchaseCheckoutPaidResponse;
