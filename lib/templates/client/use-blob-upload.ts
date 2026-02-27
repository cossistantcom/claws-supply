"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  buildCoverPathname,
  buildTemplateZipPathname,
} from "@/lib/templates/pathnames";
import {
  COVER_ALLOWED_CONTENT_TYPES,
  MAX_COVER_IMAGE_BYTES,
  MAX_TEMPLATE_ZIP_BYTES,
  TEMPLATE_ZIP_ALLOWED_CONTENT_TYPES,
} from "@/lib/templates/policy";

type UploadKind = "cover" | "zip";
type UploadStatus = "idle" | "uploading" | "success" | "error";
type UploadResult = Awaited<ReturnType<typeof upload>>;

type UploadValidation = {
  maxSizeBytes?: number;
  allowedContentTypes?: readonly string[];
};

type UseBlobUploadOptions = {
  templateSlug: string;
  sellerId: string;
  kind: UploadKind;
  version?: string;
  validation?: UploadValidation;
};

type UseBlobUploadState = {
  status: UploadStatus;
  progress: number;
  error: string | null;
  result: UploadResult | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Upload canceled.";
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Upload failed.";
}

function resolveHandleUploadUrl(templateSlug: string, kind: UploadKind): string {
  const encodedSlug = encodeURIComponent(templateSlug);

  if (kind === "cover") {
    return `/api/templates/${encodedSlug}/uploads/cover-handle`;
  }

  return `/api/templates/${encodedSlug}/uploads/template-handle`;
}

function resolveValidation(options: UseBlobUploadOptions): Required<UploadValidation> {
  if (options.kind === "cover") {
    return {
      maxSizeBytes: options.validation?.maxSizeBytes ?? MAX_COVER_IMAGE_BYTES,
      allowedContentTypes:
        options.validation?.allowedContentTypes ?? COVER_ALLOWED_CONTENT_TYPES,
    };
  }

  return {
    maxSizeBytes: options.validation?.maxSizeBytes ?? MAX_TEMPLATE_ZIP_BYTES,
    allowedContentTypes:
      options.validation?.allowedContentTypes ?? TEMPLATE_ZIP_ALLOWED_CONTENT_TYPES,
  };
}

function validateFileBeforeUpload(options: {
  file: File;
  kind: UploadKind;
  validation: Required<UploadValidation>;
}): string | null {
  if (options.file.size > options.validation.maxSizeBytes) {
    const maxSizeMb = Math.round(options.validation.maxSizeBytes / 1024 / 1024);
    return `File is too large. Maximum size is ${maxSizeMb}MB.`;
  }

  const normalizedType = options.file.type.trim().toLowerCase();
  const allowed = options.validation.allowedContentTypes.map((type) =>
    type.trim().toLowerCase(),
  );
  const isMimeAllowed = normalizedType.length > 0 && allowed.includes(normalizedType);

  if (isMimeAllowed) {
    return null;
  }

  if (options.kind === "zip" && options.file.name.toLowerCase().endsWith(".zip")) {
    return null;
  }

  const accepted = allowed.join(", ");
  return `Unsupported file type. Accepted types: ${accepted}.`;
}

export function useBlobUpload(options: UseBlobUploadOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<UseBlobUploadState>({
    status: "idle",
    progress: 0,
    error: null,
    result: null,
  });

  const handleUploadUrl = useMemo(
    () => resolveHandleUploadUrl(options.templateSlug, options.kind),
    [options.kind, options.templateSlug],
  );
  const validation = resolveValidation(options);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState({
      status: "error",
      progress: 0,
      error: "Upload canceled.",
      result: null,
    });
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (options.kind === "zip" && !options.version) {
        throw new Error("Template version is required for zip upload.");
      }

      const validationError = validateFileBeforeUpload({
        file,
        kind: options.kind,
        validation,
      });

      if (validationError) {
        setState({
          status: "error",
          progress: 0,
          error: validationError,
          result: null,
        });
        throw new Error(validationError);
      }

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setState({
        status: "uploading",
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const pathname =
          options.kind === "cover"
            ? buildCoverPathname({
                sellerId: options.sellerId,
                templateSlug: options.templateSlug,
                originalFilename: file.name,
              })
            : buildTemplateZipPathname(
                options.sellerId,
                options.templateSlug,
                options.version!,
              );

        const result = await upload(pathname, file, {
          access: options.kind === "cover" ? "public" : "private",
          handleUploadUrl,
          clientPayload: JSON.stringify({
            kind: options.kind,
            templateSlug: options.templateSlug,
            ...(options.version ? { version: options.version } : {}),
          }),
          abortSignal: abortController.signal,
          onUploadProgress: (event) => {
            setState((current) => ({
              ...current,
              progress: Math.max(0, Math.min(100, Math.round(event.percentage))),
            }));
          },
        });

        abortControllerRef.current = null;
        setState({
          status: "success",
          progress: 100,
          error: null,
          result,
        });

        return result;
      } catch (error) {
        abortControllerRef.current = null;
        setState({
          status: "error",
          progress: 0,
          error: getErrorMessage(error),
          result: null,
        });
        throw error;
      }
    },
    [
      handleUploadUrl,
      options.kind,
      options.sellerId,
      options.templateSlug,
      options.version,
      validation,
    ],
  );

  return {
    uploadFile,
    cancel,
    reset,
    status: state.status,
    progress: state.progress,
    error: state.error,
    result: state.result,
  };
}

export type BlobUploadHook = ReturnType<typeof useBlobUpload>;
