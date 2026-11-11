export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export async function httpRequest<T>(
  baseUrl: string,
  token: string | null,
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  if (!baseUrl)
    throw new ApiError("API_NOT_CONFIGURED", "Chưa cấu hình địa chỉ máy chủ.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const result = await response.json();
    if (!response.ok)
      throw new ApiError(
        result.error?.code ?? "HTTP_ERROR",
        result.error?.message ?? "Không thể thực hiện thao tác.",
        response.status,
      );
    if ("data" in result) {
      if (
        Array.isArray(result.data) &&
        result.meta &&
        ("hasNext" in result.meta || "page" in result.meta)
      )
        return { content: result.data, ...result.meta } as T;
      return result.data as T;
    }
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "NETWORK_ERROR",
      "Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lại; kết quả thao tác có thể chưa rõ.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
