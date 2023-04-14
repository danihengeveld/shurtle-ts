import { ClerkProvider } from "@clerk/nextjs";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";
export { reportWebVitals } from "next-axiom";

import { api } from "~/utils/api";

import "~/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <style jsx global>
        {`
          :root {
            --inter-font: ${inter.style.fontFamily};
          }
        `}
      </style>
      <ClerkProvider {...pageProps}>
        <Component {...pageProps} />
      </ClerkProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
