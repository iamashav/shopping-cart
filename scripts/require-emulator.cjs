// The e2e pipeline seeds, builds and signs in against Firebase. Refuse to run unless the emulators
// are active, so a mistyped command can't reseed the real catalog or touch real accounts.
const missing = ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST"].filter(
  (name) => !process.env[name],
);
if (missing.length > 0) {
  console.error(
    `${missing.join(" and ")} not set. Run \`npm run e2e\`, which starts the emulators.`,
  );
  process.exit(1);
}
console.log(
  `Using emulators: Firestore ${process.env.FIRESTORE_EMULATOR_HOST}, Auth ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
);
