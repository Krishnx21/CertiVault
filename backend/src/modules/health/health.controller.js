import { readFileSync } from "node:fs";

let version = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  version = pkg.version;
} catch {
  // fallback if version cannot be read
}

export const getLiveness = (_req, res) => {
  res.status(200).json({
    status: "ok",
    version,
    uptimeSeconds: Math.floor(process.uptime()),
  });
};

export const getReadiness = (_req, res) => {
  res.status(200).json({
    status: "ready",
    version,
    checks: {},
  });
};
