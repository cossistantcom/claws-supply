#!/usr/bin/env node

console.log("claws-supply local smoke guide");
console.log("");
console.log("1) Start web API locally in another terminal:");
console.log("   cd /Users/anthonyriera/code/hourglass/apps/web && bun run dev");
console.log("");
console.log("2) In this package, build the CLI:");
console.log("   cd /Users/anthonyriera/code/hourglass/packages/cli && bun run build");
console.log("");
console.log("3) Run auth (opens Better Auth device URL):");
console.log("   node dist/index.js auth -D");
console.log("");
console.log("4) Build from a template workspace:");
console.log("   node dist/index.js build -D");
console.log("");
console.log("5) Publish latest build:");
console.log("   node dist/index.js publish -D");
console.log("");
console.log("Requirements:");
console.log("- apps/web/.env.local must include PRIVATE_READ_WRITE_TOKEN for upload-token issuance.");
console.log("- You must sign in and approve the device code in browser during step 3.");
