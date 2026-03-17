export type ReviewErrorCode =
  | "FILE_NOT_FOUND"
  | "NOT_A_FILE"
  | "PERMISSION_DENIED"
  | "FILE_READ_FAILED"
  | "AI_FAILED";

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;
  readonly details: string | undefined;

  constructor(code: ReviewErrorCode, message: string, details?: string, cause?: unknown) {
    super(message);
    this.name = "ReviewError";
    this.code = code;
    this.details = details;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

