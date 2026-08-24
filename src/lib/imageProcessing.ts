export const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
/** Recommended aspect ratio band (width / height) — logos should be roughly square. */
export const MIN_LOGO_RATIO = 0.5;
export const MAX_LOGO_RATIO = 2;
export const MIN_LOGO_DIMENSION = 48;

export interface LogoValidationResult {
  ok: boolean;
  error?: string;
  warning?: string;
  width?: number;
  height?: number;
}

const readDimensions = (file: File) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    if (file.type === "image/svg+xml") {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });

export const validateLogoFile = async (file: File): Promise<LogoValidationResult> => {
  if (!(ALLOWED_LOGO_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      error: "Unsupported format. Please upload a PNG, JPG, WEBP or SVG file.",
    };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return {
      ok: false,
      error: `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please upload a logo under 2MB.`,
    };
  }

  const dims = await readDimensions(file);
  if (!dims) return { ok: true };

  if (dims.width < MIN_LOGO_DIMENSION || dims.height < MIN_LOGO_DIMENSION) {
    return {
      ok: false,
      error: `Image is too small (${dims.width}×${dims.height}px). Use at least ${MIN_LOGO_DIMENSION}×${MIN_LOGO_DIMENSION}px.`,
      ...dims,
    };
  }

  const ratio = dims.width / dims.height;
  if (ratio < MIN_LOGO_RATIO || ratio > MAX_LOGO_RATIO) {
    return {
      ok: true,
      warning: `This logo is ${dims.width}×${dims.height}px (very ${
        ratio > 1 ? "wide" : "tall"
      }). A near-square logo (1:1) fits best — use the crop step below.`,
      ...dims,
    };
  }

  return { ok: true, ...dims };
};

export interface CropRect {
  x: number;
  y: number;
  size: number;
}

/** Centered square crop rectangle in source pixels. */
export const centeredSquareCrop = (width: number, height: number): CropRect => {
  const size = Math.min(width, height);
  return { x: (width - size) / 2, y: (height - size) / 2, size };
};

/**
 * Crop (square) + resize an image file onto a transparent canvas of `output` px.
 * Returns a PNG blob so logos keep transparency and always fit the same box.
 */
export const cropAndResizeImage = async (
  file: File,
  crop: CropRect,
  output = 256,
): Promise<Blob> => {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read the selected image."));
      el.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = output;
    canvas.height = output;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is not supported in this browser.");
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, output, output);
    ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, output, output);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the image."))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Appends a cache-busting version so an updated logo shows immediately. */
export const withCacheVersion = (url: string, version?: string | number) => {
  if (!url) return url;
  const v = version ?? Date.now();
  return url.includes("?") ? `${url}&v=${v}` : `${url}?v=${v}`;
};
