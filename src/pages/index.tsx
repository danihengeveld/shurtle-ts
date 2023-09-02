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
                  className="text-md font-semibold"
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
                  <AvatarImage src={user.user.profileImageUrl} />
                  <AvatarFallback>
                    {user.user.firstName?.[0]}
                    {user.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Link href="/preview">
                <Button size="lg" className="text-md mt-6 w-fit font-semibold">
                  To the preview{" "}
                  <ArrowRight className="ml-2 h-4 w-4"></ArrowRight>
                </Button>
              </Link>
              <SignOutButton>
                <Button
                  variant="subtle"
                  size="lg"
                  className="text-md mt-6 w-fit font-semibold"
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
