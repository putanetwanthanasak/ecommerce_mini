/**
 * Seed: the demo catalog — two categories, four products.
 *
 * On an empty database (the local Docker stack, `docker compose down -v`) it
 * creates the catalog. On a database that already has it (Supabase, or a second
 * run) it creates nothing and only re-sets each product's `imageUrl`.
 *
 * WHERE THE DATA COMES FROM. Names, categories, prices, descriptions and image
 * URLs were copied from the live API (GET /api/products, 2026-09-24) — the same
 * rows production serves; nothing is invented (PRODUCT.md). Two of the four
 * really do have a null description in production. STOCK IS NOT production's:
 * it is a local-dev starting level, chosen so every stock state is visible
 * (The Pragmatic Programmer at 3 shows the "x left" badge).
 *
 * IDEMPOTENT, AND WHY PRODUCTS ARE NOT A TRUE UPSERT. Categories are upserted
 * on `name`, which is @unique. `Product.name` is intentionally NOT unique —
 * two products may share a name — so there is no unique key for
 * `prisma.product.upsert` to target, and adding one just for the seed would be
 * a production schema change. Products are therefore find-by-name, create only
 * if missing. That is not atomic, which is acceptable here: the seed runs once,
 * from one process (compose `migrate`, or `npm run seed` by hand), never
 * concurrently. An existing product gets only its `imageUrl` re-set — never its
 * stock, which real orders have moved, and never its price, which may have
 * been repriced on purpose.
 *
 * THE IMAGE URLS point at a public Supabase Storage bucket (`product-images`)
 * on the dev project. They are real, hosted files, but there is no upload
 * pipeline: to change an image, replace the file in the bucket or change the
 * URL here and re-run `npm run seed`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUCKET = "https://vuxlcphlshsghqcxqwjr.supabase.co/storage/v1/object/public/product-images";

const CATEGORIES = ["Electronics", "Books & Media"] as const;

const PRODUCTS: Array<{
  name: string;
  category: (typeof CATEGORIES)[number];
  // A string, not a number: this is a Decimal(10, 2) column (CLAUDE.md invariant 5).
  price: string;
  stock: number;
  description: string | null;
  imageUrl: string;
}> = [
  {
    name: "Desk Lamp",
    category: "Electronics",
    price: "38.00",
    stock: 50,
    description:
      "A weighted-base desk lamp with a swing arm, so the light goes where the work is and stays there.",
    imageUrl: `${BUCKET}/Yellow_Lamp.png`,
  },
  {
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: "89.99",
    stock: 25,
    description: null,
    imageUrl: `${BUCKET}/mechanical_keyboard.jpg`,
  },
  {
    name: "Clean Code",
    category: "Books & Media",
    price: "32.50",
    stock: 40,
    description: null,
    imageUrl: `${BUCKET}/programming_book.jpg`,
  },
  {
    name: "The Pragmatic Programmer",
    category: "Books & Media",
    price: "44.95",
    stock: 3,
    description: "Classic dev book",
    imageUrl: `${BUCKET}/Bookimage.jpg`,
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const name of CATEGORIES) {
    // update: {} — an existing category is left exactly as it is.
    const category = await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
    categoryIds.set(name, category.id);
  }

  let created = 0;
  let existing = 0;

  for (const { category, imageUrl, ...product } of PRODUCTS) {
    // findFirst + create rather than upsert — see "IDEMPOTENT" above.
    const found = await prisma.product.findFirst({ where: { name: product.name } });

    if (found) {
      // imageUrl only. Stock and price belong to the database, not the seed.
      await prisma.product.update({ where: { id: found.id }, data: { imageUrl } });
      existing++;
      console.log(`  exists  "${product.name}" (imageUrl set; stock and price untouched)`);
    } else {
      await prisma.product.create({
        data: { ...product, imageUrl, categoryId: categoryIds.get(category)! },
      });
      created++;
      console.log(`  created "${product.name}"`);
    }
  }

  console.log(`seed: ${created} product(s) created, ${existing} already present`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
