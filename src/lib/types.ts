export type Visibility = "publico" | "registrado" | "comunidad" | "restringido";

export type StoryStatus =
  | "borrador"
  | "en_revision"
  | "publicado"
  | "archivado"
  | "rechazado";

export type StoryKind =
  | "relato"
  | "testimonio"
  | "memoria"
  | "saber"
  | "lengua"
  | "visita"
  | "evento"
  | "promocion"
  | "aviso";

export interface UserPublic {
  id: number;
  display_name: string;
  role: string;
  place: string;
  avatar: string | null;
}

export interface Membership {
  id: number;
  community: number;
  community_name: string;
  community_slug: string;
  user?: UserPublic;
  role: "miembro" | "autoridad" | "moderador";
  status: "pendiente" | "activo" | "rechazado" | "retirado";
  note?: string;
  created_at: string;
}

export interface Me {
  id: number;
  email: string;
  display_name: string;
  role: string;
  bio: string;
  place: string;
  avatar: string | null;
  accepted_care_terms_at: string | null;
  communities: Membership[];
  date_joined: string;
}

export interface Location {
  place_name: string;
  latitude?: number | null;
  longitude?: number | null;
  approximate: boolean;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Story {
  id: number;
  title: string;
  summary: string;
  kind: StoryKind;
  language: string;
  visibility: Visibility;
  status: StoryStatus;
  author: UserPublic;
  community: number | null;
  community_name: string | null;
  community_slug: string | null;
  tags: Tag[];
  location: Location | null;
  cover: string | null;
  is_sensitive: boolean;
  is_featured: boolean;
  allow_comments: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  my_reaction: string | null;
  published_at: string | null;
  created_at: string;
}

export interface MediaItem {
  id: number;
  kind: "imagen" | "audio" | "video" | "documento";
  file: string | null;
  external_url: string;
  caption: string;
  credit: string;
  transcript: string;
  order: number;
}

export interface Consent {
  id?: number;
  granted_by_name?: string;
  granted_by_role?: string;
  scope: "abierto" | "comunidad" | "consulta";
  granted_on: string;
  conditions?: string;
}

export interface CareFinding {
  tipo: "lugar" | "practica" | "saber" | "persona" | string;
  fragmento: string;
  por_que: string;
  origen: "reglas" | "gemini" | string;
}

export interface CareReview {
  activo: boolean;
  resumen: string | null;
  hallazgos: CareFinding[];
  proveedor?: string;
  fecha?: string;
}

export interface StoryDetail extends Story {
  body: string;
  media: MediaItem[];
  visit: Visit | null;
  promotion: Promotion | null;
  consents: Consent[];
  review_note: string;
  updated_at: string;
}

export interface Visit {
  starts_on: string;
  ends_on: string | null;
  meeting_point: string;
  capacity: number | null;
  contact: string;
  conditions: string;
}

export interface Promotion {
  category: string;
  contact: string;
  link: string;
  price_note: string;
  active_until: string | null;
}

export interface Comment {
  id: number;
  story: number;
  author: UserPublic;
  parent: number | null;
  body: string;
  is_hidden: boolean;
  replies: Comment[];
  created_at: string;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  people: string;
  description: string;
  territory: string;
  municipality: string;
  department: string;
  latitude: string | null;
  longitude: string | null;
  cover: string | null;
  is_open_to_requests: boolean;
  member_count: number;
  my_membership: { role: string; status: string } | null;
  created_at: string;
}

export interface ArchiveSectionSummary {
  id: number;
  number: number;
  title: string;
  slug: string;
  lead: string;
}

export interface ArchiveSection extends ArchiveSectionSummary {
  body: string;
  care_note: string;
  figures: {
    id: number;
    number: number | null;
    caption: string;
    note: string;
    image: string | null;
    external_url: string;
  }[];
  sources: { id: number; kind: string; citation: string; url: string; year: string }[];
  updated_at: string;
}

export interface MapPoint {
  id: number;
  title: string;
  kind: StoryKind;
  place_name: string;
  latitude: number;
  longitude: number;
  community: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
