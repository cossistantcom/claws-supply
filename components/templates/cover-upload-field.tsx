"use client";

import {
  useBlobUpload,
  type BlobUploadHook,
} from "@/lib/templates/client/use-blob-upload";
import { FileUploadField } from "./file-upload-field";

type UploadResult = NonNullable<BlobUploadHook["result"]>;

type CoverUploadFieldProps = {
  templateSlug: string;
  sellerId: string;
  className?: string;
  disabled?: boolean;
  onUploaded?: (result: UploadResult) => void;
};

export type CoverUploadReference = {
  pathname: string;
  url: string;
  contentType: string;
  etag: string;
};

function toCoverUploadReference(result: UploadResult): CoverUploadReference {
  return {
    pathname: result.pathname,
    url: result.url,
    contentType: result.contentType,
    etag: result.etag,
  };
}

export function CoverUploadField({
  templateSlug,
  sellerId,
  className,
  disabled,
  onUploaded,
}: CoverUploadFieldProps) {
  const upload = useBlobUpload({
    templateSlug,
    sellerId,
    kind: "cover",
  });

  async function handleUploadFile(file: File) {
    const result = await upload.uploadFile(file);
    onUploaded?.(result);
  }

  return (
    <FileUploadField
      label="Cover Image"
      description="Upload a public cover image used to promote this template."
      accept="image/jpeg,image/png,image/webp,image/avif"
      className={className}
      disabled={disabled}
      status={upload.status}
      progress={upload.progress}
      error={upload.error}
      successMessage={
        upload.result
          ? `Uploaded ${toCoverUploadReference(upload.result).pathname}`
          : "Cover image uploaded."
      }
      onUploadFile={handleUploadFile}
      onCancel={upload.cancel}
      onReset={upload.reset}
    />
  );
}
