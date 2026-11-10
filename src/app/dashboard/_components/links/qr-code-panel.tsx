"use client";

import { Button } from "@/components/ui/button";
import { qrCode } from "@/lib/qr-code";
import { displayShortUrl, shortUrl } from "@/lib/site";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "../copy-button";

/** PNG export width; rounded up to whole pixels per module so edges stay sharp. */
const PNG_TARGET = 1024;

/**
 * The QR code, its short link and the downloads. Loaded on demand by `QrCodeDialog`, so the
 * encoder only ships to people who open it.
 */
export default function QrCodePanel({ slug }: { slug: string }) {
  const url = shortUrl(slug);
  const { svg, size } = qrCode(url);
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const filename = `shurtle-${slug}`;

  async function downloadPng() {
    try {
      const image = new Image();
      image.src = src;
      await image.decode();
      const px = Math.ceil(PNG_TARGET / size) * size;
      const canvas = document.createElement("canvas");
      canvas.width = px;
      canvas.height = px;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No 2D canvas");
      context.drawImage(image, 0, 0, px, px);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("PNG export failed");
      save(blob, `${filename}.png`);
    } catch {
      toast.error("Couldn't create the PNG", {
        description: "Try the SVG download instead.",
      });
    }
  }

  return (
    <>
      <div className="flex flex-col items-center px-5 pb-6 sm:px-7">
        {/* Always on white, in both themes: scanners need dark modules on a light background. */}
        <div className="w-full max-w-64 overflow-hidden rounded-2xl border bg-white shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL, nothing to optimise */}
          <img
            src={src}
            alt={`QR code for ${displayShortUrl(slug)}`}
            width={size * 8}
            height={size * 8}
            className="block aspect-square w-full"
            draggable={false}
          />
        </div>
        <div className="mt-4 flex max-w-full items-center gap-1">
          <p className="min-w-0 font-mono text-sm break-all">
            {displayShortUrl(slug)}
          </p>
          <CopyButton slug={slug} />
        </div>
      </div>

      {/* Sticky: the dialog body scrolls as one, and the downloads stay in reach on short screens. */}
      <div className="sticky bottom-0 flex items-center gap-2 border-t bg-popover px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-7 sm:py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            save(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`)
          }
          className="h-10 max-sm:flex-1 sm:h-9"
        >
          <DownloadIcon aria-hidden />
          Download SVG
        </Button>
        <Button
          type="button"
          onClick={downloadPng}
          className="h-10 max-sm:flex-1 sm:h-9"
        >
          <DownloadIcon aria-hidden />
          Download PNG
        </Button>
      </div>
    </>
  );
}

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
