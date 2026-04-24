export const BRAND_NAME = "Lenstrack";
export const BRAND_TAGLINE = "Digitally Authenticated. Genuinely Yours.";

export const PAGINATION_DEFAULT = 20;

export const JWT_COOKIE_NAMES = {
  admin: "lt_admin_token",
  store: "lt_store_token",
  customer: "lt_customer_token",
} as const;

export const JWT_ROLES = {
  admin: "admin",
  store: "store_user",
  customer: "customer",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_RATE_LIMITED: "OTP_RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
