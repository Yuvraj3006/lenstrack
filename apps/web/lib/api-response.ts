import { NextResponse } from "next/server";
import { HTTP_STATUS, ERROR_CODES } from "@lenstrack/config";

export function successResponse<T>(data: T, status = HTTP_STATUS.OK) {
  return NextResponse.json({ success: true, data }, { status });
}

export function createdResponse<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: HTTP_STATUS.CREATED });
}

export function errorResponse(
  error: string,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
) {
  return NextResponse.json({ success: false, error, code }, { status });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

export function notFoundResponse(message = "Not found") {
  return errorResponse(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

export function validationErrorResponse(message: string) {
  return errorResponse(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
}

export function conflictResponse(message: string) {
  return errorResponse(message, ERROR_CODES.CONFLICT, HTTP_STATUS.CONFLICT);
}
