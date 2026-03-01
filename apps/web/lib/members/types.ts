export type PublicMember = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  image: string | null;
  createdAt: string;
  hasVerifiedTwitterProfile: boolean;
  hasVerifiedStripeIdentity: boolean;
  isVerified: boolean;
};

export type MembersDirectoryQueryInput = {
  q?: string;
  page: number;
  limit: number;
};

export type MembersDirectoryResult = {
  items: PublicMember[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  query: string | null;
};

export type CommunitySidebarMember = Pick<
  PublicMember,
  "id" | "username" | "name" | "image" | "createdAt"
>;

export type CommunitySidebarSnapshot = {
  joinedLast24Hours: number;
  latestMembers: CommunitySidebarMember[];
};

export type SitemapMemberEntry = {
  username: string;
  updatedAt: Date;
};
