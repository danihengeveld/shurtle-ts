import { type NextPage } from "next";
import Head from "next/head";
import ShurtleForm from "~/components/shurtle-form";

const Preview: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shurtle Preview</title>
      </Head>
      <main className="grid h-screen place-items-center">
        <ShurtleForm />
      </main>
    </>
  );
};

export default Preview;
