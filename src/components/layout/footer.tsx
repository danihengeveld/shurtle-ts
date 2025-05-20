import getConfig from "next/config";
import Link from "next/link";

export function Footer() {
  const { publicRuntimeConfig } = getConfig();
  const { version } = publicRuntimeConfig;

  return (
    <footer className="w-full border-t py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Dani Hengeveld. All rights reserved.
        </p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Link
              href="https://github.com/danihengeveld/shurtle-ts/releases"
              target="_blank"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Releases
            </Link>
            {/* <Link href="/privacy" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Privacy
            </Link> */}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version: {version}
          </p>
        </div>
      </div>
    </footer>
  )
}