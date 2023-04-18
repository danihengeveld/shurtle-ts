import { type NextPage } from "next";
import Head from "next/head";
import NavMenu from "~/components/nav-menu";
import ShurtleForm from "~/components/shurtle-form";

const Preview: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shurtle Preview</title>
      </Head>

      <main className="container mx-auto flex h-screen flex-col pt-6">
        <NavMenu/>

        <div className="flex h-full flex-1 items-center justify-center">
          <ShurtleForm />
        </div>
      </main>
    </>
  );
};

export default Preview;
