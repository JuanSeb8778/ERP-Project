import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  [key: string]: unknown;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Paginated list query for a REST resource, keeping previous data during refetch. */
export function useList<T>(resource: string, params: ListParams = {}) {
  return useQuery({
    queryKey: [resource, "list", params],
    queryFn: async () => {
      const { data } = await api.get(`/${resource}`, { params });
      return { data: data.data as T[], meta: data.meta as PageMeta };
    },
    placeholderData: keepPreviousData,
  });
}

/** Single-record query. */
export function useOne<T>(resource: string, id: string | undefined) {
  return useQuery({
    queryKey: [resource, "one", id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get(`/${resource}/${id}`)).data.data as T,
  });
}

export function useCreate<T>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.post(`/${resource}`, body)).data.data as T,
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useUpdate<T>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: unknown }) =>
      (await api.patch(`/${resource}/${id}`, body)).data.data as T,
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useRemove(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/${resource}/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}

/** Local state for a table's search/sort/pagination. */
export function useTableParams(defaultSort = "createdAt:desc") {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(defaultSort);

  return {
    page,
    q,
    sort,
    setPage,
    setSort: (s: string) => {
      setSort(s);
      setPage(1);
    },
    setQ: (value: string) => {
      setQ(value);
      setPage(1);
    },
    params: { page, q: q || undefined, sort } as ListParams,
  };
}
