export type CommentCursor = string;

export type TemplateCommentAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
};

export type CommentPermissions = {
  canReply: boolean;
  canDelete: boolean;
};

export type TemplateComment = {
  id: string;
  templateId: string;
  userId: string;
  parentCommentId: string | null;
  depth: number;
  body: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  author: TemplateCommentAuthor;
  permissions: CommentPermissions;
};

export type CommentViewerPermissions = {
  isAuthenticated: boolean;
  canPost: boolean;
};

export type TemplateCommentConnection = {
  items: TemplateComment[];
  nextCursor: CommentCursor | null;
  hasMore: boolean;
  parentId: string | null;
  viewer: CommentViewerPermissions;
};

export type CommentViewerContext = {
  id: string;
  role?: string | null;
  hasTwitterAccount: boolean;
  stripeVerified: boolean;
};
