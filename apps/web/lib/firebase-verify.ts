/**
 * Firebase ID token verification WITHOUT a service account key.
 *
 * Firebase publishes its signing public keys at a well-known JWKS URL.
 * We fetch those keys, verify the JWT's RS256 signature, and check all
 * required claims — exactly what the Firebase Admin SDK does internally,
 * but without needing any credentials beyond the public project ID.
 *
 * Ref: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Firebase publishes its public keys as a JWK Set here.
// The keys are cached by jose and refreshed automatically when they rotate.
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export interface FirebaseTokenPayload extends JWTPayload {
  phone_number?: string;
  email?: string;
  name?: string;
  uid?: string;
}

/**
 * Verifies a Firebase ID token and returns its decoded payload.
 *
 * Validates:
 *  ✓ RS256 signature against Firebase's public keys
 *  ✓ `iss` = https://securetoken.google.com/{projectId}
 *  ✓ `aud` = {projectId}
 *  ✓ `exp` not expired
 *  ✓ `sub` (UID) is non-empty
 *
 * Throws if any check fails.
 */
export async function verifyFirebaseToken(
  idToken: string
): Promise<FirebaseTokenPayload> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in environment variables."
    );
  }

  const issuer = `https://securetoken.google.com/${projectId}`;

  const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
    issuer,
    audience: projectId,
    algorithms: ["RS256"],
  });

  if (!payload.sub) {
    throw new Error("Firebase token has no subject (UID).");
  }

  return payload as FirebaseTokenPayload;
}
