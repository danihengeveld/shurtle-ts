import {
  createColumnHelper,
  type CellContext,
  type ColumnDef,
} from "@tanstack/react-table";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import Date from "~/components/utils/date";
import { type RouterOutputs } from "~/utils/api";

export type Shurtle = RouterOutputs["shurtle"]["getAllForUser"][0];

const columnHelper = createColumnHelper<Shurtle>();

export const shurtlesTableColumns: ColumnDef<Shurtle>[] = [
  columnHelper.accessor("hits", {
    header: "Hits",
    cell: (info: CellContext<Shurtle, number>) => (
      <div className="font-semibold">{info.getValue()}</div>
    ),
  }) as ColumnDef<Shurtle>,
  columnHelper.accessor("slug", {
    header: "Slug",
  }) as ColumnDef<Shurtle>,
  columnHelper.accessor("url", {
    header: "Url",
    cell: (info) => (
      <Link href={info.getValue()}>
        <Button variant="link" className="p-0 font-normal">
          {info.getValue()}
        </Button>
      </Link>
    ),
  }) as ColumnDef<Shurtle>,
  columnHelper.accessor("lastHitAt", {
    header: "Last hit at",
    cell: (info) => <Date date={info.getValue()} />,
  }) as ColumnDef<Shurtle>,
  columnHelper.accessor("createdAt", {
    header: "Created at",
    cell: (info) => <Date date={info.getValue()} />,
  }) as ColumnDef<Shurtle>,
];
