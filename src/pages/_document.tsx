import Document, {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from "next/document";
import { type ReactElement } from "react";

class MyDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);

    return initialProps;
  }
  render(): ReactElement {
    return (
      <Html data-theme="dark">
        <Head>
          <meta
            name="description"
            content="Shurtle. The open source url shortener."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
