import { type NextPage } from "next";
import Head from "next/head";
import { Button } from "~/components/ui/button";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

const Home: NextPage = () => {
  const user = useUser();

  return (
    <>
      <Head>
        <title>Shurtle</title>
        <meta
          name="description"
          content="Shurtle. The open source url shortener."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="grid h-screen place-items-center">
        <div>
          {!user.isSignedIn && (
            <SignInButton>
              <Button variant="default" size="lg">
                Sign in
              </Button>
            </SignInButton>
          )}
          {user.isSignedIn && (
            <div className="flex flex-col items-center">
              <h3 className="tracking-light scroll-m-20 text-2xl font-semibold">
                Welcome {user.user.fullName}!
              </h3>
              <p className="mt-6 text-lg leading-7">
                This website is currently under construction. Come back later!
              </p>
              <SignOutButton>
                <Button variant="default" size="lg" className="mt-6">
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
