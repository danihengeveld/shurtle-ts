import {
  createColumnHelper,
  type CellContext,
  type ColumnDef,
} from "@tanstack/react-table";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/utils/data-table/column-header";
import Date from "~/components/utils/date";
import { truncate } from "~/lib/truncate";
import { type RouterOutputs } from "~/utils/api";

export type Shurtle = RouterOutputs["shurtle"]["getAllForUser"][0];

const columnHelper = createColumnHelper<Shurtle>();

export const shurtlesTableColumns: ColumnDef<Shurtle>[] = [
  columnHelper.accessor("hits", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hits" />
    ),
    cell: (info) => (
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
        <Button variant="link" className="p-0 font-normal whitespace-nowrap">
            {truncate(info.getValue(), 50)}
        </Button>
      </Link>
    ),
  }) as ColumnDef<Shurtle>,
  columnHelper.accessor("lastHitAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last hit at" />
    ),
    cell: (info) => <Date date={info.getValue()} />,
  }) as ColumnDef<Shurtle>,
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    cell: (info) => <Date date={info.getValue()} />,
  }) as ColumnDef<Shurtle>,
];
