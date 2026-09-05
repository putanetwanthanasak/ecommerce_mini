/**
 * Seed: populate `Product.imageUrl` on the four demo products.
 *
 * WHY THIS IS UPDATE-ONLY. There is no canonical fixture for the product
 * catalogue in this repo — the four rows live in the dev database, created by
 * hand. This script does not create or overwrite them; it only fills in the
 * `imageUrl` column that migration `add_product_image_url` added, matched by
 * name. Running it against a database without those rows is a no-op (it logs
 * "0 rows" and exits 0), so it is safe on CI's ephemeral Postgres too.
 *
 * Idempotent: re-running it just re-sets the same URLs, so `prisma migrate dev`
 * (which invokes this via the `prisma.seed` hook) can run it every time.
 *
 * THE URLS ARE PLACEHOLDERS. Lorem Picsum returns a real, stable JPEG per seed
 * slug — enough to see the catalogue and detail views render an <img> end to
 * end. Swap the `imageUrl` values below for real photographs (e.g.
 * https://images.unsplash.com/photo-<id>) and re-run `npm run seed`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLACEHOLDER_IMAGES: Array<{ name: string; imageUrl: string }> = [
  { name: "Desk Lamp", imageUrl: "https://picsum.photos/seed/desk-lamp/600/600" },
  { name: "Mechanical Keyboard", imageUrl: "https://picsum.photos/seed/mechanical-keyboard/600/600" },
  { name: "Clean Code", imageUrl: "https://picsum.photos/seed/clean-code/600/600" },
  { name: "The Pragmatic Programmer", imageUrl: "https://picsum.photos/seed/pragmatic-programmer/600/600" },
];

async function main() {
  let updated = 0;

  for (const { name, imageUrl } of PLACEHOLDER_IMAGES) {
    // updateMany, not update: no unique constraint on `name`, and a missing row
    // should be a skip (count 0), not a throw.
    const { count } = await prisma.product.updateMany({
      where: { name },
      data: { imageUrl },
    });
    updated += count;
    console.log(count > 0 ? `  set imageUrl on "${name}"` : `  skipped "${name}" (no matching row)`);
  }

  console.log(`seed: updated ${updated} product image URL(s)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
