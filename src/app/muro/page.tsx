"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  Button,
  CareNote,
  Empty,
  ErrorBox,
  KIND_LABEL,
  Spinner,
  StoryCard,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Community, Story, Tag } from "@/lib/types";

const KINDS = Object.entries(KIND_LABEL);

function MuroContenido() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [stories, setStories] = useState<Story[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const search = params.get("buscar") ?? "";
  const kind = params.get("tipo") ?? "";
  const tag = params.get("etiqueta") ?? "";
  const community = params.get("comunidad") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      setPage(1);
      router.replace(`/muro${next.toString() ? `?${next}` : ""}`);
    },
    [params, router]
  );

  useEffect(() => {
    void api.tags().then(setTags).catch(() => undefined);
    void api
      .communities()
      .then((data) => setCommunities(data.results))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setStories(null);
    setError(null);
    api
      .stories({ search, tipo: kind, etiqueta: tag, comunidad: community, page })
      .then((data) => {
        if (!active) return;
        setStories(data.results);
        setCount(data.count);
      })
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [search, kind, tag, community, page, user]);

  const toggleLike = async (story: Story) => {
    if (!user) {
      router.push("/entrar");
      return;
    }
    const liked = Boolean(story.my_reaction);
    try {
      const result = liked ? await api.unlike(story.id) : await api.like(story.id);
      setStories(
        (current) =>
          current?.map((item) =>
            item.id === story.id
              ? { ...item, like_count: result.like_count, my_reaction: liked ? null : "aprecio" }
              : item
          ) ?? null
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const pageCount = Math.max(1, Math.ceil(count / 12));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">El muro</h1>
          <p className="text-sm text-sierra-600">
            {user
              ? "Ve el contenido de uso abierto, el de personas registradas y el de sus comunidades."
              : "Sin iniciar sesión se ve únicamente el contenido de uso abierto."}
          </p>
        </div>
        {user && (
          <Link
            href="/publicar"
            className="rounded-lg bg-monte-600 px-4 py-2 text-sm font-medium text-white hover:bg-monte-700"
          >
            Publicar algo
          </Link>
        )}
      </div>

      {!user && (
        <CareNote>
          Para ver el contenido reservado a la comunidad hay que{" "}
          <Link href="/entrar" className="underline">
            iniciar sesión
          </Link>{" "}
          y pertenecer a ella. Los saberes reservados no se publican en ningún nivel de
          acceso.
        </CareNote>
      )}

      <form
        className="grid gap-3 rounded-xl border border-sierra-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-sierra-700">Buscar</span>
          <input
            type="search"
            defaultValue={search}
            placeholder="Título, lugar, contenido…"
            className={inputClass}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setParam("buscar", (event.target as HTMLInputElement).value);
              }
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-sierra-700">Tipo</span>
          <select
            value={kind}
            className={inputClass}
            onChange={(event) => setParam("tipo", event.target.value)}
          >
            <option value="">Todos</option>
            {KINDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-sierra-700">Comunidad</span>
          <select
            value={community}
            className={inputClass}
            onChange={(event) => setParam("comunidad", event.target.value)}
          >
            <option value="">Todas</option>
            {communities.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-sierra-700">Etiqueta</span>
          <select
            value={tag}
            className={inputClass}
            onChange={(event) => setParam("etiqueta", event.target.value)}
          >
            <option value="">Todas</option>
            {tags.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </form>

      {error && <ErrorBox>{error}</ErrorBox>}

      {stories === null ? (
        <Spinner />
      ) : stories.length === 0 ? (
        <Empty title="No hay historias para mostrar">
          Puede que el contenido exista pero requiera pertenecer a una comunidad o un
          permiso explícito.
        </Empty>
      ) : (
        <>
          <p className="text-sm text-sierra-500">{count} historia(s)</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} onLike={toggleLike} />
            ))}
          </div>
          {pageCount > 1 && (
            <nav className="flex items-center justify-center gap-3 pt-4" aria-label="Páginas">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-sierra-600">
                Página {page} de {pageCount}
              </span>
              <Button
                variant="ghost"
                disabled={page >= pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default function MuroPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MuroContenido />
    </Suspense>
  );
}
