import { CliError, EXIT_CODES } from "../utils/errors";

export type PublishFlowDeps = {
  createZipUploadToken: (input: {
    baseUrl: string;
    token: string;
    slug: string;
  }) => Promise<{
    token: string;
    pathname: string;
    maximumSizeInBytes: number;
  }>;
  uploadZip: (input: {
    pathname: string;
    token: string;
    zipBytes: Uint8Array;
  }) => Promise<void>;
  finalizeTemplatePublish: (input: {
    baseUrl: string;
    token: string;
    title: string;
    slug: string;
    pathname: string;
  }) => Promise<{
    template: {
      slug: string;
      title: string;
      status: string;
    };
    templateUrl: string;
  }>;
};

export async function publishArtifactFlow(options: {
  deps: PublishFlowDeps;
  baseUrl: string;
  accessToken: string;
  slug: string;
  title: string;
  zipBytes: Uint8Array;
}): Promise<{
  uploadPathname: string;
  templateUrl: string;
  template: {
    slug: string;
    title: string;
    status: string;
  };
}> {
  const uploadToken = await options.deps.createZipUploadToken({
    baseUrl: options.baseUrl,
    token: options.accessToken,
    slug: options.slug,
  });

  if (options.zipBytes.byteLength > uploadToken.maximumSizeInBytes) {
    throw new CliError(
      `Artifact exceeds upload size limit (${options.zipBytes.byteLength} > ${uploadToken.maximumSizeInBytes}).`,
      {
        exitCode: EXIT_CODES.INVALID_INPUT,
      },
    );
  }

  await options.deps.uploadZip({
    pathname: uploadToken.pathname,
    token: uploadToken.token,
    zipBytes: options.zipBytes,
  });

  const finalize = await options.deps.finalizeTemplatePublish({
    baseUrl: options.baseUrl,
    token: options.accessToken,
    title: options.title,
    slug: options.slug,
    pathname: uploadToken.pathname,
  });

  return {
    uploadPathname: uploadToken.pathname,
    templateUrl: finalize.templateUrl,
    template: finalize.template,
  };
}
