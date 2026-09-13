// Run with `node --no-experimental-require-module`. Netlify's function runtime refused to
// require() ES modules, which crashed every route that loaded firebase-admin/auth, while local
// Node allowed it. Loading the server SDKs in that stricter mode catches such regressions.
const modules = ["firebase-admin/app", "firebase-admin/firestore", "firebase-admin/auth", "stripe"];

if (process.features.require_module) {
  console.error("Run this with --no-experimental-require-module, otherwise it proves nothing.");
  process.exit(1);
}

let failed = false;
for (const name of modules) {
  try {
    require(name);
    console.log(`ok    ${name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL  ${name}: ${error.code ?? ""} ${error.message.split("\n")[0]}`);
  }
}

process.exit(failed ? 1 : 0);
