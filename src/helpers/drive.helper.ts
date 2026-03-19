import axios from "axios";

import { UrlType } from "@prisma/client";
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

export type UrlValidationRules = {
  maxFileSizeBytes?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  allowedAspectRatios?: string[];
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
  urlType?: UrlType | null;
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

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function getAspectRatio(width?: number, height?: number): string | null {
  if (!width || !height) return null;
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function validateFileAgainstRules(
  file: VerifiedFile,
  urlType: UrlType,
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

  if (urlType === UrlType.Image) {
    if (!file.mimeType.startsWith("image/")) {
      errors.push("This file is not an image");
    }

    const width = file.imageMetadata?.width;
    const height = file.imageMetadata?.height;

    if (
      safeRules.minWidth != null &&
      width != null &&
      width < safeRules.minWidth
    ) {
      errors.push(`Image width must be at least ${safeRules.minWidth}px`);
    }

    if (
      safeRules.maxWidth != null &&
      width != null &&
      width > safeRules.maxWidth
    ) {
      errors.push(`Image width must not exceed ${safeRules.maxWidth}px`);
    }

    if (
      safeRules.minHeight != null &&
      height != null &&
      height < safeRules.minHeight
    ) {
      errors.push(`Image height must be at least ${safeRules.minHeight}px`);
    }

    if (
      safeRules.maxHeight != null &&
      height != null &&
      height > safeRules.maxHeight
    ) {
      errors.push(`Image height must not exceed ${safeRules.maxHeight}px`);
    }

    if (
      safeRules.allowedAspectRatios?.length &&
      width != null &&
      height != null
    ) {
      const ratio = getAspectRatio(width, height);

      if (ratio && !safeRules.allowedAspectRatios.includes(ratio)) {
        errors.push(
          `Image aspect ratio must be one of: ${safeRules.allowedAspectRatios.join(
            ", "
          )}`
        );
      }
    }
  }

  if (urlType === UrlType.Video) {
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
  } catch (error: any) {
    const status = error?.response?.status;

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

export async function verifyDriveFileAgainstRules({
  url,
  urlType,
  urlValidationRules,
}: VerifyDriveFileAgainstRulesArgs) {
  const effectiveUrlType = urlType ?? "GENERIC";

  if (effectiveUrlType === "GENERIC") {
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
