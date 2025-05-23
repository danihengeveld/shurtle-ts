import { type NextPage } from "next";
import Head from "next/head";
import { toast } from "sonner";
import { shurtlesTableColumns } from "~/components/dashboard/shurtles-table/columns";
import { DataTable } from "~/components/dashboard/shurtles-table/data-table";
import StatCard from "~/components/dashboard/stat-card";
import NavMenu from "~/components/nav-menu";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/utils/api";

const DashboardPage: NextPage = () => {
  const shurtles = api.shurtle.get.allForUser.useQuery(
    {
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      onError(error) {
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          toast.warning("Uh oh! I'm afraid you are hitting the rate limiters.", {
            description: error.message,
            cancel: {
              label: "I'll wait!",
              onClick: () => void (0),
            }
          });
        }
      },
      retry: 1,
    }
  );

  return (
    <>
      <Head>
        <title>Dashboard | Shurtle</title>
        <meta
          name="description"
          content="See and manage all your created Shurtles."
          key="desc"
        />
        <meta property="og:url" content="https://www.shurtle.app/dashboard" />
      </Head>

      <main className="container mx-auto flex h-screen flex-col pt-6">
        <NavMenu />

        <div className="flex h-full flex-1 items-center justify-center">
          <div className="h-full max-h-full w-full pt-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-4">
              <Card className="md:col-span-3 md:row-span-4 md:min-h-0">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Shurtles</CardTitle>
                </CardHeader>
                <CardContent>
                  {shurtles.isSuccess && (
                    <DataTable
                      columns={shurtlesTableColumns}
                      data={shurtles.data}
                    />
                  )}
                </CardContent>
              </Card>
              <StatCard
                title="Total Shurtles"
                value={shurtles.data?.length?.toString() ?? "0"}
                description="Keep Shurtling to boost the numbers!"
              />
              <StatCard
                title="Total hits"
                value={
                  shurtles.data && shurtles.data.length > 0
                    ? shurtles.data
                      ?.map((i) => i.hits)
                      .reduce((a, b) => a + b)
                      .toString() ?? "0"
                    : "-"
                }
                description="Spread the word!"
              />
              <StatCard
                title="First Shurtle created"
                value={
                  shurtles.data
                    ?.map((i) => i.createdAt)
                    .sort((a, b) => a.getTime() - b.getTime())[0]
                }
                description="One of the first!"
              />
              <StatCard
                title="Last Shurtle created"
                value={shurtles.data
                  ?.map((i) => i.createdAt)
                  .sort((a, b) => a.getTime() - b.getTime())
                  .pop()}
                description="Keep it up!"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
