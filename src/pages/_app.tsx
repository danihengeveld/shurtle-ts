import { ClerkProvider } from "@clerk/nextjs";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";
export { reportWebVitals } from "next-axiom";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Toaster } from "~/components/ui/toaster";
import { ThemeProvider } from "next-themes";

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
        </ClerkProvider>
      </ThemeProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
