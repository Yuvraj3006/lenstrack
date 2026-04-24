import type { ConfirmationResult } from "firebase/auth";

/**
 * Module-level store for Firebase ConfirmationResult.
 * Next.js SPA navigation keeps the JS module in memory, so this
 * persists between /verify and /verify/otp without any context or storage.
 */
let _confirmationResult: ConfirmationResult | null = null;
let _pendingMobile: string | null = null;

export function setFirebaseConfirmation(result: ConfirmationResult, mobile: string): void {
  _confirmationResult = result;
  _pendingMobile = mobile;
}

export function getFirebaseConfirmation(): ConfirmationResult | null {
  return _confirmationResult;
}

export function getPendingMobile(): string | null {
  return _pendingMobile;
}

export function clearFirebaseConfirmation(): void {
  _confirmationResult = null;
  _pendingMobile = null;
}
