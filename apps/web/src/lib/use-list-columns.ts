import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  DEFAULT_LIST_COLUMNS,
  withColumnDefaults,
  type ListColumns,
  type ListPage,
} from "@cadence/shared";

/**
 * The user's per-page column counts, with defaults filled in.
 *
 * `withColumnDefaults` handles both an absent field (every row predates the
 * feature) and a partial one, so callers never guard a read. While the query is
 * still loading it returns the defaults — which reproduce the pre-feature
 * layout, so a page renders correctly rather than flashing a wrong column count
 * and reflowing once data arrives.
 */
export function useListColumns(): {
  columns: ListColumns;
  ready: boolean;
  setColumns: (page: ListPage, count: number) => void;
} {
  const me = useQuery(api.users.getMe);
  const save = useMutation(api.users.setListColumns);

  const columns = me ? withColumnDefaults(me.listColumns) : DEFAULT_LIST_COLUMNS;

  const setColumns = (page: ListPage, count: number) => {
    // The whole object is sent, since the mutation stores it whole. Building it
    // from the resolved values means a page the user has never touched is
    // written at its default rather than as undefined.
    void save({ listColumns: { ...columns, [page]: count } });
  };

  return { columns, ready: me !== undefined, setColumns };
}
