import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const purchaseSaleTypeEnum = pgEnum("purchase_sale_type", [
  "direct",
  "browsing",
]);
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "completed",
  "failed",
]);
export const templateStatusEnum = pgEnum("template_status", [
  "draft",
  "published",
  "unpublished",
  "deleted",
]);
export const adPlacementEnum = pgEnum("ad_placement", [
  "sidebar",
  "results",
  "both",
]);
export const adCampaignStatusEnum = pgEnum("ad_campaign_status", [
  "checkout_pending",
  "active",
  "cancel_scheduled",
  "ended",
  "canceled",
  "suspended_policy",
]);

// Better Auth core tables
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    username: text("username").notNull(),
    displayUsername: text("display_username"),
    bio: text("bio"),
    role: userRoleEnum("role").notNull().default("user"),
    xAccountId: text("x_account_id"),
    xUsername: text("x_username"),
    xLinkedAt: timestamp("x_linked_at"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeAccountId: text("stripe_account_id"),
    stripeVerified: boolean("stripe_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => ({
    usernameUnique: uniqueIndex("user_username_unique").on(table.username),
    xAccountIdUnique: uniqueIndex("user_x_account_id_unique").on(table.xAccountId),
  }),
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  }),
);

export const deviceCode = pgTable(
  "device_code",
  {
    id: text("id").primaryKey(),
    deviceCode: text("device_code").notNull(),
    userCode: text("user_code").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at").notNull(),
    status: text("status").notNull(),
    lastPolledAt: timestamp("last_polled_at"),
    pollingInterval: integer("polling_interval"),
    clientId: text("client_id"),
    scope: text("scope"),
  },
  (table) => ({
    deviceCodeUnique: uniqueIndex("device_code_device_code_unique").on(table.deviceCode),
    userCodeUnique: uniqueIndex("device_code_user_code_unique").on(table.userCode),
    userIdIdx: index("device_code_user_id_idx").on(table.userId),
    expiresAtIdx: index("device_code_expires_at_idx").on(table.expiresAt),
    statusIdx: index("device_code_status_idx").on(table.status),
  }),
);

// Marketplace tables
export const template = pgTable(
  "template",
  {
    id: text("id").primaryKey(),
    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    shortDescription: text("short_description").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    category: text("category").notNull(),
    zipObjectKey: text("zip_object_key"),
    fileSizeBytes: integer("file_size_bytes"),
    coverImageUrl: text("cover_image_url"),
    version: integer("version"),
    versionNotes: text("version_notes"),
    publisherHash: text("publisher_hash"),
    archiveHash: text("archive_hash"),
    status: templateStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at"),
    unpublishedAt: timestamp("unpublished_at"),
    deletedAt: timestamp("deleted_at"),
    isFlagged: boolean("is_flagged").notNull().default(false),
    flagReason: text("flag_reason"),
    downloadCount: integer("download_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("template_slug_unique").on(table.slug),
    sellerIdx: index("template_seller_id_idx").on(table.sellerId),
    categoryIdx: index("template_category_idx").on(table.category),
    statusIdx: index("template_status_idx").on(table.status),
    flaggedIdx: index("template_is_flagged_idx").on(table.isFlagged),
    createdAtIdx: index("template_created_at_idx").on(table.createdAt),
    priceCheck: check("template_price_cents_check", sql`${table.priceCents} >= 0`),
    fileSizeCheck: check(
      "template_file_size_bytes_check",
      sql`${table.fileSizeBytes} >= 0`,
    ),
    publishedFieldsCheck: check(
      "template_published_fields_check",
      sql`${table.status} <> 'published' OR (${table.version} IS NOT NULL AND ${table.zipObjectKey} IS NOT NULL AND ${table.fileSizeBytes} IS NOT NULL)`,
    ),
    publisherHashCheck: check(
      "template_publisher_hash_check",
      sql`${table.publisherHash} IS NULL OR ${table.publisherHash} ~ '^[a-f0-9]{64}$'`,
    ),
    archiveHashCheck: check(
      "template_archive_hash_check",
      sql`${table.archiveHash} IS NULL OR ${table.archiveHash} ~ '^[a-f0-9]{64}$'`,
    ),
    downloadCountCheck: check(
      "template_download_count_check",
      sql`${table.downloadCount} >= 0`,
    ),
  }),
);

export const templateVersion = pgTable(
  "template_version",
  {
    id: text("id").primaryKey(),
    templateId: text("template_id")
      .notNull()
      .references(() => template.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    zipObjectKey: text("zip_object_key").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    releaseNotes: text("release_notes"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    templateVersionUnique: uniqueIndex("template_version_template_version_unique").on(
      table.templateId,
      table.version,
    ),
    templateIdx: index("template_version_template_id_idx").on(table.templateId),
    createdAtIdx: index("template_version_created_at_idx").on(table.createdAt),
    fileSizeCheck: check(
      "template_version_file_size_bytes_check",
      sql`${table.fileSizeBytes} >= 0`,
    ),
  }),
);

export const purchase = pgTable(
  "purchase",
  {
    id: text("id").primaryKey(),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => template.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull(),
    commissionRate: integer("commission_rate").notNull(),
    platformFeeAmountCents: integer("platform_fee_amount_cents").notNull(),
    sellerPayoutAmountCents: integer("seller_payout_amount_cents").notNull(),
    saleType: purchaseSaleTypeEnum("sale_type").notNull(),
    referralCode: text("referral_code"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeTransferId: text("stripe_transfer_id"),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    buyerTemplateUnique: uniqueIndex("purchase_buyer_template_unique").on(
      table.buyerId,
      table.templateId,
    ),
    buyerIdx: index("purchase_buyer_id_idx").on(table.buyerId),
    sellerIdx: index("purchase_seller_id_idx").on(table.sellerId),
    templateIdx: index("purchase_template_id_idx").on(table.templateId),
    createdAtIdx: index("purchase_created_at_idx").on(table.createdAt),
    priceCheck: check("purchase_price_cents_check", sql`${table.priceCents} >= 0`),
    commissionRateCheck: check(
      "purchase_commission_rate_check",
      sql`${table.commissionRate} >= 0 AND ${table.commissionRate} <= 100`,
    ),
    platformFeeCheck: check(
      "purchase_platform_fee_check",
      sql`${table.platformFeeAmountCents} >= 0`,
    ),
    sellerPayoutCheck: check(
      "purchase_seller_payout_check",
      sql`${table.sellerPayoutAmountCents} >= 0`,
    ),
  }),
);

export const review = pgTable(
  "review",
  {
    id: text("id").primaryKey(),
    templateId: text("template_id")
      .notNull()
      .references(() => template.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body"),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    templateUserUnique: uniqueIndex("review_template_user_unique").on(
      table.templateId,
      table.userId,
    ),
    templateIdx: index("review_template_id_idx").on(table.templateId),
    userIdx: index("review_user_id_idx").on(table.userId),
    createdAtIdx: index("review_created_at_idx").on(table.createdAt),
    ratingCheck: check(
      "review_rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
    titleLengthCheck: check(
      "review_title_length_check",
      sql`${table.title} IS NULL OR char_length(${table.title}) <= 200`,
    ),
  }),
);

export const commissionOverride = pgTable(
  "commission_override",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    directRate: integer("direct_rate").notNull(),
    browsingRate: integer("browsing_rate").notNull(),
    notes: text("notes"),
    createdByAdminId: text("created_by_admin_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userUnique: uniqueIndex("commission_override_user_id_unique").on(table.userId),
    userIdx: index("commission_override_user_id_idx").on(table.userId),
    createdByAdminIdx: index("commission_override_created_by_admin_id_idx").on(
      table.createdByAdminId,
    ),
    directRateCheck: check(
      "commission_override_direct_rate_check",
      sql`${table.directRate} >= 0 AND ${table.directRate} <= 100`,
    ),
    browsingRateCheck: check(
      "commission_override_browsing_rate_check",
      sql`${table.browsingRate} >= 0 AND ${table.browsingRate} <= 100`,
    ),
  }),
);

export const adCampaign = pgTable(
  "ad_campaign",
  {
    id: text("id").primaryKey(),
    advertiserUserId: text("advertiser_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    websiteUrl: text("website_url").notNull(),
    shortDescription: text("short_description").notNull(),
    logoUrl: text("logo_url").notNull(),
    logoObjectKey: text("logo_object_key").notNull(),
    placement: adPlacementEnum("placement").notNull(),
    stripePriceId: text("stripe_price_id").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeSubscriptionStatus: text("stripe_subscription_status"),
    status: adCampaignStatusEnum("status").notNull().default("checkout_pending"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    checkoutExpiresAt: timestamp("checkout_expires_at"),
    canceledAt: timestamp("canceled_at"),
    suspendedAt: timestamp("suspended_at"),
    suspendedReason: text("suspended_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    advertiserIdx: index("ad_campaign_advertiser_user_id_idx").on(
      table.advertiserUserId,
    ),
    statusIdx: index("ad_campaign_status_idx").on(table.status),
    placementIdx: index("ad_campaign_placement_idx").on(table.placement),
    currentPeriodEndIdx: index("ad_campaign_current_period_end_idx").on(
      table.currentPeriodEnd,
    ),
    stripeCheckoutSessionUnique: uniqueIndex(
      "ad_campaign_stripe_checkout_session_id_unique",
    ).on(table.stripeCheckoutSessionId),
    stripeSubscriptionUnique: uniqueIndex(
      "ad_campaign_stripe_subscription_id_unique",
    ).on(table.stripeSubscriptionId),
    liveCampaignPerUserUnique: uniqueIndex("ad_campaign_live_user_unique")
      .on(table.advertiserUserId)
      .where(
        sql`${table.status} in ('checkout_pending', 'active', 'cancel_scheduled')`,
      ),
    companyNameLengthCheck: check(
      "ad_campaign_company_name_length_check",
      sql`char_length(${table.companyName}) >= 2 AND char_length(${table.companyName}) <= 80`,
    ),
    shortDescriptionLengthCheck: check(
      "ad_campaign_short_description_length_check",
      sql`char_length(${table.shortDescription}) >= 20 AND char_length(${table.shortDescription}) <= 180`,
    ),
    websiteUrlLengthCheck: check(
      "ad_campaign_website_url_length_check",
      sql`char_length(${table.websiteUrl}) >= 8 AND char_length(${table.websiteUrl}) <= 500`,
    ),
  }),
);

export const stripeWebhookEvent = pgTable(
  "stripe_webhook_event",
  {
    eventId: text("event_id").primaryKey(),
    eventType: text("event_type").notNull(),
    processedAt: timestamp("processed_at").notNull().defaultNow(),
  },
  (table) => ({
    eventTypeIdx: index("stripe_webhook_event_event_type_idx").on(table.eventType),
    processedAtIdx: index("stripe_webhook_event_processed_at_idx").on(
      table.processedAt,
    ),
  }),
);
