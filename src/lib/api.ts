/**
 * Cliente de la API de Memorias Vivas.
 *
 * Guarda los tokens en localStorage y refresca el access token una sola vez
 * cuando la API responde 401.
 */
const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000/api";

const ACCESS = "mv.access";
const REFRESH = "mv.refresh";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(messageFrom(status, data));
    this.status = status;
    this.data = data;
  }

  /** Errores por campo, como los devuelve DRF. */
  fieldErrors(): Record<string, string> {
    if (!this.data || typeof this.data !== "object") return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.data as Record<string, unknown>)) {
      out[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
    return out;
  }
}

function messageFrom(status: number, data: unknown): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.detail ?? record.non_field_errors;
    if (detail) return Array.isArray(detail) ? String(detail[0]) : String(detail);
    const first = Object.values(record)[0];
    if (first) return Array.isArray(first) ? String(first[0]) : String(first);
  }
  if (status === 401) return "Necesita iniciar sesión.";
  if (status === 403) return "No tiene permiso para esta acción.";
  if (status === 404) return "No encontrado, o no tiene acceso a este contenido.";
  return `Error ${status}`;
}

export const tokens = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH);
  },
  set(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS, access);
    if (refresh) window.localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS);
    window.localStorage.removeItem(REFRESH);
  },
};

async function refreshAccess(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  const response = await fetch(`${BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    tokens.clear();
    return false;
  }
  const data = await response.json();
  tokens.set(data.access, data.refresh);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Para subir archivos: se envía como FormData sin Content-Type. */
  form?: FormData;
  /** No intentar refrescar el token (evita bucles). */
  noRetry?: boolean;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, form, noRetry, signal } = options;
  const headers: Record<string, string> = {};
  const access = tokens.access;
  if (access) headers.Authorization = `Bearer ${access}`;
  if (!form && body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    signal,
  });

  if (response.status === 401 && !noRetry && tokens.refresh) {
    if (await refreshAccess()) {
      return request<T>(path, { ...options, noRetry: true });
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? safeJson(text) : null;
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text.slice(0, 200) };
  }
}

export function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" ) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  // --- auth ---
  login: (email: string, password: string) =>
    request<{ access: string; refresh: string; user: import("./types").Me }>(
      "/auth/login/",
      { method: "POST", body: { email, password } }
    ),
  register: (payload: {
    email: string;
    password: string;
    display_name: string;
    place?: string;
    accept_care_terms: boolean;
  }) => request<import("./types").Me>("/auth/registro/", { method: "POST", body: payload }),
  me: () => request<import("./types").Me>("/auth/yo/"),
  updateMe: (payload: Partial<import("./types").Me>) =>
    request<import("./types").Me>("/auth/yo/", { method: "PATCH", body: payload }),

  // --- muro ---
  stories: (params: Record<string, string | number | boolean | undefined> = {}) =>
    request<import("./types").Paginated<import("./types").Story>>(
      `/historias/${query(params)}`
    ),
  story: (id: number | string) =>
    request<import("./types").StoryDetail>(`/historias/${id}/`),
  createStory: (payload: Record<string, unknown>) =>
    request<import("./types").StoryDetail>("/historias/", { method: "POST", body: payload }),
  updateStory: (id: number, payload: Record<string, unknown>) =>
    request<import("./types").StoryDetail>(`/historias/${id}/`, {
      method: "PATCH",
      body: payload,
    }),
  myStories: (params: Record<string, string | number | undefined> = {}) =>
    request<import("./types").Paginated<import("./types").Story>>(
      `/historias/mias/${query(params)}`
    ),
  pendingReview: () =>
    request<import("./types").Paginated<import("./types").Story>>("/historias/por-revisar/"),
  sendToReview: (id: number) =>
    request<import("./types").StoryDetail>(`/historias/${id}/enviar_a_revision/`, {
      method: "POST",
      body: {},
    }),
  publish: (id: number, note = "") =>
    request<import("./types").StoryDetail>(`/historias/${id}/publicar/`, {
      method: "POST",
      body: { note },
    }),
  reject: (id: number, note = "") =>
    request<import("./types").StoryDetail>(`/historias/${id}/rechazar/`, {
      method: "POST",
      body: { note },
    }),
  like: (id: number) =>
    request<{ like_count: number }>(`/historias/${id}/aprecio/`, {
      method: "POST",
      body: {},
    }),
  unlike: (id: number) =>
    request<{ like_count: number }>(`/historias/${id}/aprecio/`, { method: "DELETE" }),
  consents: (id: number) =>
    request<import("./types").Consent[]>(`/historias/${id}/autorizaciones/`),
  addConsent: (id: number, payload: Record<string, unknown>) =>
    request<import("./types").Consent>(`/historias/${id}/autorizaciones/`, {
      method: "POST",
      body: payload,
    }),
  mapPoints: () => request<import("./types").MapPoint[]>("/historias/mapa/"),

  // --- comentarios ---
  comments: (storyId: number) =>
    request<import("./types").Paginated<import("./types").Comment>>(
      `/comentarios/${query({ story: storyId, parent: "" })}`
    ),
  addComment: (storyId: number, body: string, parent?: number) =>
    request<import("./types").Comment>("/comentarios/", {
      method: "POST",
      body: { story: storyId, body, parent: parent ?? null },
    }),
  deleteComment: (id: number) =>
    request<void>(`/comentarios/${id}/`, { method: "DELETE" }),

  // --- comunidades ---
  communities: () =>
    request<import("./types").Paginated<import("./types").Community>>("/comunidades/"),
  community: (slug: string) =>
    request<import("./types").Community>(`/comunidades/${slug}/`),
  joinCommunity: (slug: string, note = "") =>
    request<import("./types").Membership>(`/comunidades/${slug}/solicitar/`, {
      method: "POST",
      body: { note },
    }),
  communityMembers: (slug: string) =>
    request<import("./types").Membership[]>(`/comunidades/${slug}/miembros/`),
  decideMembership: (slug: string, membershipId: number, status: string, role?: string) =>
    request<import("./types").Membership>(
      `/comunidades/${slug}/miembros/${membershipId}/decidir/`,
      { method: "POST", body: { status, role } }
    ),

  // --- archivo ---
  sections: () =>
    request<import("./types").ArchiveSectionSummary[]>("/archivo/"),
  section: (slug: string) =>
    request<import("./types").ArchiveSection>(`/archivo/${slug}/`),
  sources: () =>
    request<import("./types").ArchiveSection["sources"]>("/fuentes/"),

  // --- etiquetas ---
  tags: () => request<import("./types").Tag[]>("/etiquetas/"),

  // --- reportes ---
  report: (payload: { story?: number; comment?: number; reason: string; detail?: string }) =>
    request<unknown>("/reportes/", { method: "POST", body: payload }),
};
