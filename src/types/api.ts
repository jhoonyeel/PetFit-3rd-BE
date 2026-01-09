export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  content: T | null;
};

export function ok<T>(content: T, message = "OK", code = "OK"): ApiResponse<T> {
  return { success: true, code, message, content };
}

export function fail<T>(message: string, code: string): ApiResponse<T> {
  return { success: false, code, message, content: null };
}
