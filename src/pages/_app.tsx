import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";
export { reportWebVitals } from "next-axiom";

import { api } from "~/utils/api";

import { ThemeProvider } from "next-themes";
import { Toaster } from "~/components/ui/toaster";
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
      <ThemeProvider attribute="class">
        <ClerkProvider {...pageProps}>
          <Component {...pageProps} />
          <Toaster />
          <Analytics />
        </ClerkProvider>
      </ThemeProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
