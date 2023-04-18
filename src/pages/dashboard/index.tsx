import { type NextPage } from "next";
import Head from "next/head";
import ShurtlesTable from "~/components/dashboard/shurtles-table";
import StatCard from "~/components/dashboard/stat-card";
import NavMenu from "~/components/nav-menu";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/utils/api";

const Dashboard: NextPage = () => {
  const shurtles = api.shurtle.getAllForUser.useQuery({
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <>
      <Head>
        <title>Shurtle Dashboard</title>
      </Head>

      <main className="container mx-auto flex h-screen flex-col pt-6">
        <NavMenu />

        <div className="flex h-full flex-1 items-center justify-center">
          <div className="h-full w-full pt-8">
            <div className="grid grid-cols-4 grid-rows-4 gap-4">
              <Card className="col-span-3 row-span-4">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Shurtles</CardTitle>
                </CardHeader>
                <CardContent>
                  {shurtles.isSuccess && (
                    <ScrollArea>
                      <ShurtlesTable shurtles={shurtles.data} />
                    </ScrollArea>
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
                  shurtles.data
                    ?.map((i) => i.hits)
                    .reduce((a, b) => a + b)
                    .toString() ?? "0"
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

export default Dashboard;
