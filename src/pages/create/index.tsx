import { type NextPage } from "next";
import Head from "next/head";
import NavMenu from "~/components/nav-menu";
import ShurtleForm from "~/components/shurtle-form";

const ShurtlePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create | Shurtle</title>
        <meta
          name="description"
          content="Create new, blazingly fast short URL's."
          key="desc"
        />
        <meta property="og:url" content="https://www.shurtle.app/create" />
      </Head>

      <main className="container mx-auto flex h-screen flex-col pt-6">
        <NavMenu />

        <div className="flex h-full flex-1 items-center justify-center">
          <ShurtleForm />
        </div>
      </main>
    </>
  );
};

export default ShurtlePage;
