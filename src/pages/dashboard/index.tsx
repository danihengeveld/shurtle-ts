import { type NextPage } from "next";
import Head from "next/head";
import ShurtlesTable from "~/components/dashboard/shurtles-table";
import StatCard from "~/components/dashboard/stat-card";
import NavMenu from "~/components/nav-menu";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/hooks/ui/use-toast";
import { api } from "~/utils/api";

const Dashboard: NextPage = () => {
  const { toast } = useToast();

  const shurtles = api.shurtle.getAllForUser.useQuery(
    {
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      onError(error) {
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          toast({
            variant: "destructive",
            title: "Uh oh! I'm afraid you are hitting the rate limiters.",
            description: error.message,
            action: (
              <ToastAction altText="I'll wait!">I&apos;ll wait!</ToastAction>
            ),
          });
        }
      },
      retry: 1,
    }
  );

  return (
    <>
      <Head>
        <title>Shurtle Dashboard</title>
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
                <CardContent className="overflow-scroll">
                  {shurtles.isSuccess && (
                    <ShurtlesTable shurtles={shurtles.data} />
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

export default Dashboard;
