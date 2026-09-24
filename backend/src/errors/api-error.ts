export interface ErrorDetail { field?: string; message: string; code?: string; }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: ErrorDetail[]) {
    super(message);
    this.name = "ApiError";
  }
}

export class RequestValidationError extends ApiError {
  constructor(details: ErrorDetail[]) { super(400, "VALIDATION_ERROR", "Dữ liệu đầu vào không hợp lệ.", details); }
}
