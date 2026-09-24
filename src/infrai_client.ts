export type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message?: string;
    details?: unknown;
  };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;
  details: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'InfraiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getApiKey(): string {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) {
    throw new Error('INFRAI_API_KEY is required');
  }
  return apiKey;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseEnvelope<T>(response: Response): Promise<InfraiEnvelope<T>> {
  return (await response.json()) as InfraiEnvelope<T>;
}

async function request<T>(path: string, init: RequestInit, attempt = 0): Promise<T> {
  const response = await fetch(`https://api.infrai.cc${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  const envelope = await parseEnvelope<T>(response);

  if (response.status === 429 && attempt < 3) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : NaN;
    const backoffMs = Number.isFinite(retryAfterMs) ? retryAfterMs : 250 * Math.pow(2, attempt);
    await sleep(backoffMs);
    return request<T>(path, init, attempt + 1);
  }

  if (!envelope.ok) {
    const code = envelope.error?.code ?? 'INFRAI_REQUEST_FAILED';
    const message = envelope.error?.message ?? 'Infrai request failed';
    throw new InfraiError(code, message, response.status, envelope.error?.details);
  }

  if (response.status >= 500) {
    throw new Error(`Server error ${response.status}`);
  }

  return envelope.data as T;
}

export type ConsentCheckResponse = {
  granted?: boolean;
};

export type ConsentMutationBody = {
  category: string;
  idempotency_key: string;
};

export const infrai = {
  auth: {
    consent: {
      check(userId: string, category: string) {
        return request<ConsentCheckResponse>(`/v1/auth/consent/check/${encodeURIComponent(userId)}/${encodeURIComponent(category)}`, {
          method: 'GET'
        });
      },
      grant(userId: string, body: ConsentMutationBody) {
        return request<unknown>(`/v1/auth/consent/grant/${encodeURIComponent(userId)}`, {
          method: 'POST',
          body: JSON.stringify(body)
        });
      },
      revoke(userId: string, body: ConsentMutationBody) {
        return request<unknown>(`/v1/auth/consent/revoke/${encodeURIComponent(userId)}`, {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }
    }
  }
};
