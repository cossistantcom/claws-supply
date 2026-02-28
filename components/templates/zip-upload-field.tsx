"use client";

import {
  useBlobUpload,
  type BlobUploadHook,
} from "@/lib/templates/client/use-blob-upload";
import { FileUploadField } from "./file-upload-field";

type UploadResult = NonNullable<BlobUploadHook["result"]>;

type ZipUploadFieldProps = {
  templateSlug: string;
  sellerId: string;
  version: number;
  className?: string;
  disabled?: boolean;
  onUploaded?: (result: UploadResult) => void;
};

export type ZipUploadReference = {
  pathname: string;
  url: string;
  contentType: string;
  etag: string;
};

function toZipUploadReference(result: UploadResult): ZipUploadReference {
  return {
    pathname: result.pathname,
    url: result.url,
    contentType: result.contentType,
    etag: result.etag,
  };
}

export function ZipUploadField({
  templateSlug,
  sellerId,
  version,
  className,
  disabled,
  onUploaded,
}: ZipUploadFieldProps) {
  const upload = useBlobUpload({
    templateSlug,
    sellerId,
    kind: "zip",
    version,
  });

  async function handleUploadFile(file: File) {
    const result = await upload.uploadFile(file);
    onUploaded?.(result);
  }

  return (
    <FileUploadField
      label="Template Zip"
      description="Upload a versioned zip archive. Existing versions are immutable."
      accept=".zip,application/zip,application/x-zip-compressed"
      className={className}
      disabled={disabled}
      status={upload.status}
      progress={upload.progress}
      error={upload.error}
      successMessage={
        upload.result
          ? `Uploaded ${toZipUploadReference(upload.result).pathname}`
          : "Zip uploaded."
      }
      onUploadFile={handleUploadFile}
      onCancel={upload.cancel}
      onReset={upload.reset}
    />
  );
}
