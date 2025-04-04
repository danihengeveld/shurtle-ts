import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

const Home: NextPage = () => {
  const user = useUser();

  return (
    <>
      <Head>
        <title>Shurtle</title>
        <meta
          name="description"
          content="The open source, blazingly fast URL shortener."
          key="desc"
        />
      </Head>
      <main className="grid h-screen place-items-center text-center">
        <div className="flex flex-col items-center">
          <h1 className="mb-4 text-8xl font-bold">Shurtle</h1>
          <p className="mb-8 px-4 text-xl">
            The open source, blazingly fast URL shortener.
          </p>
          {!user.isSignedIn && (
            <>
              <p className="mb-6 px-4 text-lg">Sign in to try it out!</p>
              <SignInButton>
                <Button
                  variant="default"
                  size="lg"
                >
                  Sign in
                </Button>
              </SignInButton>
            </>
          )}
          {user.isSignedIn && (
            <div className="flex flex-col items-center">
              <div className="flex flex-row items-center">
                <h3 className="scroll-m-20 text-2xl font-semibold">
                  Hi {user.user.fullName}!
                </h3>
                <Avatar className="ml-3">
                  <AvatarImage src={user.user.imageUrl} />
                  <AvatarFallback>
                    {user.user.firstName?.[0]}
                    {user.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Link href="/create">
                <Button size="lg" className="mt-6 w-fit">
                  Try it out! <ArrowRight className="ml-2 h-4 w-4"></ArrowRight>
                </Button>
              </Link>
              <SignOutButton>
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-6 w-fit"
                >
                  Sign out
                </Button>
              </SignOutButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
