import { describe, expect, it, vi } from "vitest";
import { publishArtifactFlow } from "../src/lib/publish-flow";
import { CliError } from "../src/utils/errors";

describe("publishArtifactFlow", () => {
  it("uploads and finalizes with expected payload", async () => {
    const createZipUploadToken = vi.fn().mockResolvedValue({
      token: "upload-token",
      pathname: "templates/private/zips/user/slug/v1.zip",
      maximumSizeInBytes: 100,
    });
    const uploadZip = vi.fn().mockResolvedValue(undefined);
    const finalizeTemplatePublish = vi.fn().mockResolvedValue({
      template: {
        slug: "demo",
        title: "Demo",
        status: "draft",
      },
      templateUrl: "http://localhost/openclaw/template/demo",
    });

    const result = await publishArtifactFlow({
      deps: {
        createZipUploadToken,
        uploadZip,
        finalizeTemplatePublish,
      },
      baseUrl: "http://localhost:3039",
      accessToken: "abc",
      slug: "demo",
      title: "Demo",
      zipBytes: new Uint8Array([1, 2, 3]),
    });

    expect(uploadZip).toHaveBeenCalledTimes(1);
    expect(finalizeTemplatePublish).toHaveBeenCalledWith({
      baseUrl: "http://localhost:3039",
      token: "abc",
      title: "Demo",
      slug: "demo",
      pathname: "templates/private/zips/user/slug/v1.zip",
    });
    expect(result.template.status).toBe("draft");
  });

  it("fails when artifact exceeds max size", async () => {
    const createZipUploadToken = vi.fn().mockResolvedValue({
      token: "upload-token",
      pathname: "templates/private/zips/user/slug/v1.zip",
      maximumSizeInBytes: 2,
    });

    await expect(
      publishArtifactFlow({
        deps: {
          createZipUploadToken,
          uploadZip: vi.fn(),
          finalizeTemplatePublish: vi.fn(),
        },
        baseUrl: "http://localhost:3039",
        accessToken: "abc",
        slug: "demo",
        title: "Demo",
        zipBytes: new Uint8Array([1, 2, 3]),
      }),
    ).rejects.toBeInstanceOf(CliError);
  });
});
