export type StripeStatusDTO = {
  connected: boolean;
  verified: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
};

export type ProfileDTO = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  image: string | null;
  x: {
    linked: boolean;
    username: string | null;
    accountId: string | null;
    linkedAt: string | null;
  };
  stripe: StripeStatusDTO;
};

export type ProfileUpdateInput = {
  name: string;
  bio: string | null;
};

export type ConnectXResponse = {
  url: string | null;
  alreadyLinked: boolean;
};

export type ConnectStripeResponse = {
  url: string;
  accountId: string;
};

export type DeleteAccountResponse = {
  success: boolean;
};

