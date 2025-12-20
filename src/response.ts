export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  content: T;
}

export const ok = <T>(content: T, message = "OK"): ApiResponse<T> => ({
  success: true,
  code: "OK",
  message,
  content,
});

export const fail = <T>(
  code: string,
  message: string,
  content: T
): ApiResponse<T> => ({
  success: false,
  code,
  message,
  content,
});
