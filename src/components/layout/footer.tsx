import getConfig from "next/config";

export function Footer() {
  const { publicRuntimeConfig } = getConfig();
  const { version } = publicRuntimeConfig;

  return (
    <footer className="w-full border-t py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Dani Hengeveld. All rights reserved.
        </p>
        <div className="flex gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version: {version}
          </p>
          {/* <Link href="/terms" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Privacy
            </Link> */}
        </div>
      </div>
    </footer>
  )
}