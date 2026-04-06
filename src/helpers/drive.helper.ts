import axios, { AxiosError } from "axios";

const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

export type UrlTypeValue = "Image" | "Video" | "Generic";

export type UrlValidationRules = {
  maxFileSizeBytes?: number;
  allowedPaperFormats?: Array<"A1" | "A4">;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
};

export type VerifiedFile = {
  name: string;
  mimeType: string;
  size: number | null;
  imageMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
  } | null;
  videoMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: number;
  } | null;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type VerifyDriveFileAgainstRulesArgs = {
  url: string;
  urlType?: UrlTypeValue | null;
  urlValidationRules?: UrlValidationRules | null;
};

function extractDriveFileId(input: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/[^/]+\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function isGoogleDriveLink(input: string): boolean {
  return /(?:drive|docs)\.google\.com/.test(input);
}

function formatBytes(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return "Unknown size";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

const ISO_A_SERIES_RATIO = Math.sqrt(2);
const ISO_A_SERIES_TOLERANCE = 0.03;
const PAPER_FORMAT_MIN_PIXELS = {
  A4: {
    shortEdge: 1240,
    longEdge: 1754,
  },
  A1: {
    shortEdge: 3508,
    longEdge: 4967,
  },
} as const;

function isWithinIsoASeriesRatio(width?: number, height?: number): boolean {
  if (!width || !height) return false;

  const longerEdge = Math.max(width, height);
  const shorterEdge = Math.min(width, height);
  const ratio = longerEdge / shorterEdge;

  return Math.abs(ratio - ISO_A_SERIES_RATIO) <= ISO_A_SERIES_TOLERANCE;
}

function meetsPaperFormatMinimumPixels(
  width: number,
  height: number,
  paperFormat: keyof typeof PAPER_FORMAT_MIN_PIXELS
): boolean {
  const longerEdge = Math.max(width, height);
  const shorterEdge = Math.min(width, height);
  const minimum = PAPER_FORMAT_MIN_PIXELS[paperFormat];

  return shorterEdge >= minimum.shortEdge && longerEdge >= minimum.longEdge;
}

function formatPaperThreshold(
  paperFormat: keyof typeof PAPER_FORMAT_MIN_PIXELS
): string {
  const minimum = PAPER_FORMAT_MIN_PIXELS[paperFormat];
  return `${paperFormat}: at least ${minimum.shortEdge} x ${minimum.longEdge}px`;
}

export function validateFileAgainstRules(
  file: VerifiedFile,
  urlType: UrlTypeValue,
  rules?: UrlValidationRules | null
): ValidationResult {
  const errors: string[] = [];
  const safeRules = rules ?? {};

  if (
    safeRules.maxFileSizeBytes != null &&
    file.size != null &&
    file.size > safeRules.maxFileSizeBytes
  ) {
    errors.push(
      `File size exceeds limit of ${formatBytes(safeRules.maxFileSizeBytes)}`
    );
  }

  if (urlType === "Image") {
    const isImageFile = file.mimeType.startsWith("image/");

    if (!isImageFile) {
      return {
        isValid: false,
        errors: [
          safeRules.allowedPaperFormats?.length
            ? "This file must be an image. PDFs are not allowed for A1/A4 poster submissions."
            : "This file must be an image",
        ],
      };
    }

    const width = file.imageMetadata?.width;
    const height = file.imageMetadata?.height;

    if (safeRules.allowedPaperFormats?.length) {
      if (width != null && height != null) {
        if (!isWithinIsoASeriesRatio(width, height)) {
          errors.push(
            `File must use ISO A-series proportions for ${safeRules.allowedPaperFormats.join(
              "/"
            )} submissions`
          );
        } else {
          const satisfiesAtLeastOneSelectedFormat =
            safeRules.allowedPaperFormats.some((paperFormat) =>
              meetsPaperFormatMinimumPixels(width, height, paperFormat)
            );

          if (!satisfiesAtLeastOneSelectedFormat) {
            errors.push(
              `Image resolution is too low. Accepted minimum sizes: ${safeRules.allowedPaperFormats
                .map(formatPaperThreshold)
                .join(" or ")}`
            );
          }
        }
      } else {
        errors.push(
          "File dimensions could not be read, so A1/A4 layout could not be validated"
        );
      }
    }
  }

  if (urlType === "Video") {
    if (!file.mimeType.startsWith("video/")) {
      errors.push("This file is not a video");
    }

    const durationMillis = file.videoMetadata?.durationMillis;
    const durationSeconds =
      durationMillis != null ? Math.floor(durationMillis / 1000) : null;

    if (
      safeRules.minDurationSeconds != null &&
      durationSeconds != null &&
      durationSeconds < safeRules.minDurationSeconds
    ) {
      errors.push(
        `Video must be at least ${safeRules.minDurationSeconds} seconds long`
      );
    }

    if (
      safeRules.maxDurationSeconds != null &&
      durationSeconds != null &&
      durationSeconds > safeRules.maxDurationSeconds
    ) {
      errors.push(
        `Video must not exceed ${safeRules.maxDurationSeconds} seconds`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

async function getDriveFileMetadata(url: string): Promise<{
  verified: boolean;
  message?: string;
  fileId?: string;
  file?: VerifiedFile | null;
}> {
  if (!url || typeof url !== "string") {
    throw new Error("URL is required");
  }

  if (!isGoogleDriveLink(url)) {
    return {
      verified: false,
      message: "Not a Google Drive link",
      file: null,
    };
  }

  const fileId = extractDriveFileId(url);

  if (!fileId) {
    return {
      verified: false,
      message: "Invalid or incomplete Google Drive link",
      file: null,
    };
  }

  try {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        params: {
          key: GOOGLE_DRIVE_API_KEY,
          fields: "id,name,mimeType,size,imageMediaMetadata,videoMediaMetadata",
          supportsAllDrives: true,
        },
      }
    );

    const file = response.data;

    return {
      verified: true,
      fileId,
      file: {
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? Number(file.size) : null,
        imageMetadata: file.imageMediaMetadata
          ? {
              width: file.imageMediaMetadata.width ?? undefined,
              height: file.imageMediaMetadata.height ?? undefined,
              rotation: file.imageMediaMetadata.rotation ?? undefined,
            }
          : null,
        videoMetadata: file.videoMediaMetadata
          ? {
              width: file.videoMediaMetadata.width ?? undefined,
              height: file.videoMediaMetadata.height ?? undefined,
              durationMillis: file.videoMediaMetadata.durationMillis
                ? Number(file.videoMediaMetadata.durationMillis)
                : undefined,
            }
          : null,
      },
    };
  } catch (error: unknown) {
    const status = axios.isAxiosError(error)
      ? (error as AxiosError).response?.status
      : undefined;

    if (status === 403) {
      return {
        verified: false,
        message: "File is not accessible. Check sharing permissions.",
        file: null,
      };
    }

    if (status === 404) {
      return {
        verified: false,
        message: "File not found",
        file: null,
      };
    }

    throw new Error("Unable to verify file");
  }
}

async function checkDriveFileDownloadAccess(fileId: string): Promise<{
  verified: boolean;
  message?: string;
}> {
  try {
    await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      params: {
        key: GOOGLE_DRIVE_API_KEY,
        alt: "media",
        supportsAllDrives: true,
      },
      headers: {
        Range: "bytes=0-0",
      },
      responseType: "arraybuffer",
    });

    return {
      verified: true,
    };
  } catch (error: unknown) {
    const status = axios.isAxiosError(error)
      ? (error as AxiosError).response?.status
      : undefined;

    if (status === 403) {
      return {
        verified: false,
        message:
          "File cannot be downloaded for validation. Check sharing permissions.",
      };
    }

    if (status === 404) {
      return {
        verified: false,
        message: "File not found",
      };
    }

    return {
      verified: false,
      message: "Unable to download file for validation",
    };
  }
}

export async function verifyDriveFileAgainstRules({
  url,
  urlType,
  urlValidationRules,
}: VerifyDriveFileAgainstRulesArgs) {
  const effectiveUrlType = urlType ?? "Generic";

  if (effectiveUrlType === "Generic") {
    return {
      verified: true,
      message: "Generic URL does not require file verification",
      file: null,
      validation: {
        isValid: true,
        errors: [],
      },
    };
  }

  const metadataResult = await getDriveFileMetadata(url);

  if (!metadataResult.verified || !metadataResult.file) {
    return {
      verified: false,
      message: metadataResult.message || "Unable to verify file",
      file: metadataResult.file ?? null,
      validation: {
        isValid: false,
        errors: metadataResult.message ? [metadataResult.message] : [],
      },
    };
  }

  if (metadataResult.fileId) {
    const downloadAccessResult = await checkDriveFileDownloadAccess(
      metadataResult.fileId
    );

    if (!downloadAccessResult.verified) {
      return {
        verified: false,
        message:
          downloadAccessResult.message ||
          "Unable to download file for validation",
        file: metadataResult.file,
        fileId: metadataResult.fileId,
        validation: {
          isValid: false,
          errors: downloadAccessResult.message
            ? [downloadAccessResult.message]
            : [],
        },
      };
    }
  }

  const validation = validateFileAgainstRules(
    metadataResult.file,
    effectiveUrlType,
    urlValidationRules
  );

  return {
    verified: validation.isValid,
    message: validation.isValid
      ? "File verified successfully"
      : "File found, but it does not meet the requirements",
    fileId: metadataResult.fileId,
    file: metadataResult.file,
    validation,
  };
}
