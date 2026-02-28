"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Loader2Icon, UploadCloudIcon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type FileUploadFieldProps = {
  label: string;
  description?: string;
  accept: string;
  className?: string;
  disabled?: boolean;
  status: UploadStatus;
  progress: number;
  error: string | null;
  successMessage?: string;
  renderStatus?: (state: {
    status: UploadStatus;
    progress: number;
    error: string | null;
    successMessage: string;
  }) => ReactNode;
  onUploadFile: (file: File) => Promise<void>;
  onCancel?: () => void;
  onReset?: () => void;
};

export function FileUploadField({
  label,
  description,
  accept,
  className,
  disabled = false,
  status,
  progress,
  error,
  successMessage = "Upload completed.",
  renderStatus,
  onUploadFile,
  onCancel,
  onReset,
}: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file || disabled || status === "uploading") {
      return;
    }

    await onUploadFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    void handleFile(file).catch(() => undefined);
  }

  const statusUi = renderStatus ? (
    renderStatus({
      status,
      progress,
      error,
      successMessage,
    })
  ) : (
    <>
      {status === "uploading" ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Loader2Icon className="size-4 animate-spin" />
            <span>Uploading... {progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <p className="text-xs text-emerald-600">{successMessage}</p>
      ) : null}

      {status === "error" && error ? (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <XCircleIcon className="size-4" />
          <span>{error}</span>
        </div>
      ) : null}
    </>
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div
        className={cn(
          "border border-dashed border-border p-4 transition-colors",
          isDragging ? "border-foreground bg-muted/40" : "bg-background/40",
          disabled ? "opacity-60" : "",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && status !== "uploading") {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            void handleFile(file).catch(() => undefined);
            event.currentTarget.value = "";
          }}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UploadCloudIcon className="size-4" />
            <span>Drag and drop a file, or choose from disk.</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || status === "uploading"}
              onClick={() => inputRef.current?.click()}
            >
              Choose File
            </Button>

            {status === "uploading" && onCancel ? (
              <Button type="button" size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}

            {status !== "uploading" && onReset ? (
              <Button type="button" size="sm" variant="ghost" onClick={onReset}>
                Reset
              </Button>
            ) : null}
          </div>

          {statusUi}
        </div>
      </div>
    </div>
  );
}
