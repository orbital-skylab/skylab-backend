import axios from "axios";

import {
  UrlValidationRules,
  validateFileAgainstRules,
  VerifiedFile,
  verifyDriveFileAgainstRules,
} from "../../src/helpers/drive.helper";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("validateFileAgainstRules", () => {
  const aSeriesRules: UrlValidationRules = {
    allowedPaperFormats: ["A1", "A4"],
  };

  it("accepts image files with ISO A-series proportions and sufficient pixels", () => {
    const file: VerifiedFile = {
      name: "poster.png",
      mimeType: "image/png",
      size: 1024,
      imageMetadata: {
        width: 1754,
        height: 1240,
      },
    };

    const result = validateFileAgainstRules(file, "Image", aSeriesRules);

    expect(result).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it("rejects image files without ISO A-series proportions", () => {
    const file: VerifiedFile = {
      name: "poster-square.png",
      mimeType: "image/png",
      size: 1024,
      imageMetadata: {
        width: 1200,
        height: 1200,
      },
    };

    const result = validateFileAgainstRules(file, "Image", aSeriesRules);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "File must use ISO A-series proportions for A1/A4 submissions"
    );
  });

  it("rejects PDFs for A1/A4 poster submissions", () => {
    const file: VerifiedFile = {
      name: "poster.pdf",
      mimeType: "application/pdf",
      size: 1024,
      imageMetadata: null,
    };

    const result = validateFileAgainstRules(file, "Image", aSeriesRules);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      "This file must be an image. PDFs are not allowed for A1/A4 poster submissions.",
    ]);
  });

  it("rejects A1 submissions when the image only meets A4 minimum pixels", () => {
    const file: VerifiedFile = {
      name: "poster-a4.png",
      mimeType: "image/png",
      size: 1024,
      imageMetadata: {
        width: 1404,
        height: 993,
      },
    };

    const result = validateFileAgainstRules(file, "Image", {
      allowedPaperFormats: ["A1"],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Image resolution is too low. Accepted minimum sizes: A1: at least 3508 x 4967px"
    );
  });

  it("accepts image files when no paper-format validation is configured", () => {
    const file: VerifiedFile = {
      name: "freeform.png",
      mimeType: "image/png",
      size: 1024,
      imageMetadata: {
        width: 800,
        height: 800,
      },
    };

    const result = validateFileAgainstRules(file, "Image", {});

    expect(result).toEqual({
      isValid: true,
      errors: [],
    });
  });
});

describe("verifyDriveFileAgainstRules", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it("fails when the file metadata is readable but the media is not downloadable", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "poster.png",
          mimeType: "image/png",
          size: "2048",
          imageMediaMetadata: {
            width: 1754,
            height: 1240,
          },
        },
      } as never)
      .mockRejectedValueOnce({
        response: {
          status: 403,
        },
      } as never);

    const result = await verifyDriveFileAgainstRules({
      url: "https://drive.google.com/file/d/test-file-id/view",
      urlType: "Image",
      urlValidationRules: {
        allowedPaperFormats: ["A4"],
      },
    });

    expect(result.verified).toBe(false);
    expect(result.message).toBe("Unable to download file for validation");
    expect(result.validation.errors).toContain(
      "Unable to download file for validation"
    );
  });

  it("passes when the file is readable, downloadable, and meets validation", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          name: "poster.png",
          mimeType: "image/png",
          size: "2048",
          imageMediaMetadata: {
            width: 1754,
            height: 1240,
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: new ArrayBuffer(1),
      } as never);

    const result = await verifyDriveFileAgainstRules({
      url: "https://drive.google.com/file/d/test-file-id/view",
      urlType: "Image",
      urlValidationRules: {
        allowedPaperFormats: ["A4"],
      },
    });

    expect(result.verified).toBe(true);
    expect(result.message).toBe("File verified successfully");
    expect(result.validation.errors).toEqual([]);
  });
});
