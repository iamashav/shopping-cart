import "server-only";

// Shown to admins so the host's real function runtime can be checked, e.g. to decide whether the
// jose override for jwks-rsa (needed when require(esm) is unavailable) can be removed.
export function getRuntimeInfo() {
  return {
    node: process.version,
    requireModule: Boolean(process.features.require_module),
    platform: process.env.AWS_EXECUTION_ENV ?? `${process.platform}/${process.arch}`,
    nodeOptionsDisableRequireModule: (process.env.NODE_OPTIONS ?? "").includes(
      "no-experimental-require-module",
    ),
  };
}
