import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 0.85;

/**
 * Center-crops an image file to a square and downscales it to a small JPEG
 * data URL so it fits comfortably in localStorage.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(AVATAR_SIZE, side);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    return canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
  } finally {
    bitmap.close();
  }
}

export function ProfileAvatar({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--brand-soft)] font-semibold text-[color:var(--brand-deep)]",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL
        <img src={src} alt="" className="size-full object-cover" />
      ) : initial ? (
        initial
      ) : (
        <UserRound className="size-1/2" />
      )}
    </span>
  );
}
