// The only file that calls fetch (ESLint). Hooks in api/use*.ts build on it;
// components never import it directly.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new HttpError(response.status, url);
    return (await response.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new HttpError(response.status, url);
    return (await response.json()) as T;
  }
}

export const httpClient = new HttpClient('/api');
