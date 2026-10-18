import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(
  new URL("../extension/release-channel.js", import.meta.url),
  "utf8",
);
test("configured update channel sends version only; no customer/admin token or device ID", async () => {
  let args;
  const c = vm.createContext({
    URL,
    AbortSignal,
    chrome: { runtime: { getManifest: () => ({ version: "4.6.6" }) } },
    fetch: async (...a) => {
      args = a;
      return { ok: true };
    },
  });
  vm.runInContext(source, c);
  c.GPTYAR_RELEASE_ENDPOINT =
    "https://example.supabase.co/functions/v1/gptyar-api/public/check-for-update";
  await c.GPTYARUpdateRequest(
    "https://api.gptyar.com/client/check-for-update",
    {
      body: JSON.stringify({
        token: "SENSITIVE",
        device_id: "PRIVATE",
        version: "4.6.5",
      }),
    },
  );
  assert.deepEqual(JSON.parse(args[1].body), { version: "4.6.6" });
  assert(!JSON.stringify(args).includes("SENSITIVE"));
  assert(!JSON.stringify(args).includes("PRIVATE"));
});
test("unconfigured channel preserves the original API and functionality", async () => {
  let url;
  const c = vm.createContext({
    URL,
    AbortSignal,
    fetch: async (u) => {
      url = u;
    },
  });
  vm.runInContext(source, c);
  await c.GPTYARUpdateRequest(
    "https://api.gptyar.com/client/check-for-update",
    {},
  );
  assert.equal(url, "https://api.gptyar.com/client/check-for-update");
});
test("source version and new manifest agree", () => {
  const manifest = JSON.parse(
    fs.readFileSync(new URL("../extension/manifest.json", import.meta.url)),
  );
  assert.equal(manifest.version, "4.6.6");
  assert.equal(manifest.manifest_version, 3);
  const bg = fs.readFileSync(
    new URL("../extension/background.js", import.meta.url),
    "utf8",
  );
  assert(bg.startsWith("importScripts('release-channel.js');"));
  assert.equal((bg.match(/globalThis\.GPTYARUpdateRequest/g) || []).length, 1);
});

test("packager actually wires the public endpoint into the ZIP and leaves source unchanged", async () => {
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { join } = await import("node:path");
  const root = fileURLToPath(new URL("..", import.meta.url)),
    dir = mkdtempSync(join(root, ".test-package-")),
    zip = join(dir, "release.zip");
  try {
    const base = "https://fixture.supabase.co/functions/v1/gptyar-api";
    execFileSync("python3", [
      join(root, "scripts/package.py"),
      "--api-base",
      base,
      "--output",
      zip,
    ]);
    const result = JSON.parse(
      execFileSync(
        "python3",
        [
          "-c",
          "import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({'channel':z.read('release-channel.js').decode(),'version':json.loads(z.read('manifest.json'))['version']}))",
          zip,
        ],
        { encoding: "utf8" },
      ),
    );
    assert(result.channel.includes(base + "/public/check-for-update"));
    assert.equal(result.version, "4.6.6");
    assert(!source.includes(base));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
