import { db } from "../src/lib/firebase/db";
import { categorySchema, productSchema } from "../src/lib/catalog/schema";
import { categories, products } from "./seed-data";

async function seed() {
  const batch = db.batch();

  for (const category of categories) {
    batch.set(db.collection("categories").doc(category.slug), categorySchema.parse(category));
  }
  for (const product of products) {
    batch.set(db.collection("products").doc(product.slug), productSchema.parse(product));
  }

  await batch.commit();
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
