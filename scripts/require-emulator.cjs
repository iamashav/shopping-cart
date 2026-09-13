// The e2e pipeline seeds and builds against Firestore. Refuse to run unless the emulator is
// active, so a mistyped command can't reseed the real catalog.
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "FIRESTORE_EMULATOR_HOST is not set. Run `npm run e2e`, which starts the emulator.",
  );
  process.exit(1);
}
console.log(`Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
