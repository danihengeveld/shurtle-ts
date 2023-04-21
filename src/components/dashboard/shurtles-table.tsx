import Link from "next/link";
import { type FC } from "react";
import { type RouterOutputs } from "~/utils/api";
import { Button } from "../ui/button";
import Date from "../utils/date";

type Shurtles = RouterOutputs["shurtle"]["getAllForUser"];

const ShurtlesTable: FC<{ shurtles: Shurtles }> = ({ shurtles }) => {
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="border-b font-medium">
        <tr>
          <th scope="col" className="py-4 pl-2">
            Hits
          </th>
          <th scope="col" className="py-4 pl-2">
            Slug
          </th>
          <th scope="col" className="py-4 pl-2">
            Url
          </th>
          <th scope="col" className="py-4 pl-2">
            Last hit at
          </th>
          <th scope="col" className="py-4 px-2">
            Created at
          </th>
        </tr>
      </thead>
      <tbody>
        {shurtles.map((shurtle) => {
          return (
            <tr key={shurtle.slug} className="border-b">
              <td className="whitespace-nowrap pl-2 font-medium">
                {shurtle.hits}
              </td>
              <td className="whitespace-nowrap pl-2">{shurtle.slug}</td>
              <td className="whitespace-nowrap pl-2">
                <Link href={shurtle.url}>
                  <Button variant="link" className="p-0 font-normal">
                    {shurtle.url}
                  </Button>
                </Link>
              </td>
              <td className="whitespace-nowrap pl-2">
                <Date date={shurtle.lastHitAt} />
              </td>
              <td className="whitespace-nowrap px-2">
                <Date date={shurtle.createdAt} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ShurtlesTable;
