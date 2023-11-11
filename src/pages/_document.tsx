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
      <Html>
        <Head>
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Create a Shurtle" />
          <meta
            property="og:description"
            content="Create new, blazingly fast short URL's."
          />
          <meta
            property="og:image"
            content="https://www.shurtle.app/assets/img/turtle-white.svg"
          />
          <meta property="og:url" content="https://www.shurtle.app/" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
