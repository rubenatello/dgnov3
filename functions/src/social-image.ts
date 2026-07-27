import sharp from "sharp";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

/** Return whether a URL points to DGNO's controlled image storage. */
export function controlledFeaturedImageUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;
    if (
      url.hostname !== "firebasestorage.googleapis.com" &&
      url.hostname !== "storage.googleapis.com"
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function allowedFetchUrl(rawUrl: string, logoRequest: boolean): URL | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;

    if (logoRequest) {
      return url.hostname === "dgno.us" ? url : null;
    }

    return controlledFeaturedImageUrl(url.toString()) ? url : null;
  } catch {
    return null;
  }
}

/** Fetch a bounded image without allowing arbitrary server-side requests. */
export async function fetchControlledImage(
  rawUrl: string,
  logoRequest = false,
): Promise<Buffer> {
  const url = allowedFetchUrl(rawUrl, logoRequest);
  if (!url) throw new Error("Image URL is not on an approved host");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: controller.signal,
      headers: {"user-agent": "DGNO-Social-Card/1.0"},
    });
    if (!response.ok) {
      throw new Error(`Image request failed with ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new Error("Image request returned a non-image response");
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_SOURCE_BYTES) {
      throw new Error("Image exceeds the social-card source limit");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_SOURCE_BYTES) {
      throw new Error("Image is empty or exceeds the source limit");
    }
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

async function translucentLogo(logo: Buffer): Promise<Buffer> {
  const {data, info} = await sharp(logo)
    .resize({width: 132, height: 132, fit: "contain"})
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});

  for (let index = 3; index < data.length; index += info.channels) {
    data[index] = Math.round(data[index] * 0.72);
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  }).png().toBuffer();
}

/** Compose the reporting photograph and DGNO watermark into a 1200x630 JPEG. */
export async function composeSocialCard(
  featuredImage: Buffer,
  logoImage: Buffer,
): Promise<Buffer> {
  const logo = await translucentLogo(logoImage);
  const plate = Buffer.from(
    "<svg width=\"180\" height=\"180\" " +
      "xmlns=\"http://www.w3.org/2000/svg\">" +
      "<rect width=\"180\" height=\"180\" rx=\"24\" fill=\"#fff\" " +
      "fill-opacity=\"0.76\"/></svg>",
  );

  return sharp(featuredImage)
    .rotate()
    .resize(CARD_WIDTH, CARD_HEIGHT, {fit: "cover", position: "attention"})
    .composite([
      {input: plate, left: 980, top: 410},
      {input: logo, left: 1004, top: 434},
    ])
    .jpeg({quality: 84, progressive: true, mozjpeg: true})
    .toBuffer();
}
