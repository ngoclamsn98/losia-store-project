/* eslint-disable no-console */
// prisma/seed.ts
// Run: `npx prisma db seed` (package.json "prisma": { "seed": "tsx prisma/seed.ts" })
// or:  `npx tsx prisma/seed.ts`

import prisma from "../src/lib/prisma";

// ── Seed sources ────────────────────────────────────────────────────────────────
import productTypes from "./seeds/ProductType";
import { sizeOptions } from "./seeds/SizeOption";
import { ecoImpactData } from "./seeds/EcoImpact";

// Map nhãn VI → EN cho EcoImpact.productGroup (khóa @unique)
const GROUP_MAP: Record<string, string> = {
  "Váy (Dress)": "Dress",
  "Áo (Top)": "Top",
  "Áo len (Sweaters)": "Sweaters",
  "Áo khoác (Coats & Jackets)": "Coats & Jackets",
  "Quần jeans (Jeans)": "Jeans",
  "Quần dài (Pants)": "Pants",
  "Chân váy (Skirts)": "Skirts",
  "Quần short (Shorts)": "Shorts",
};

async function seedProductTypes() {
  // 1) Upsert parent types trước (parent === null)
  const parentTypes = productTypes.filter((t) => t.parent === null);
  const parentIdByName = new Map<string, string>();

  for (const p of parentTypes) {
    const up = await prisma.productType.upsert({
      where: { name: p.name }, // unique
      update: { nameVi: p.nameVi ?? p.name },
      create: {
        name: p.name,
        nameVi: p.nameVi ?? p.name,
        parentId: null,
      },
      select: { id: true, name: true },
    });
    parentIdByName.set(up.name, up.id);
  }

  // 2) Upsert child types (có parent: string)
  const children = productTypes.filter((t) => t.parent !== null);
  for (const c of children) {
    const parentName = String(c.parent);
    const parentId = parentIdByName.get(parentName)
      ?? (await prisma.productType.findUnique({
        where: { name: parentName },
        select: { id: true },
      }))?.id
      ?? null;

    if (!parentId) {
      console.warn(
        `  ⚠️  Bỏ qua child "${c.name}" vì chưa tìm thấy parent "${parentName}".`
      );
      continue;
    }

    await prisma.productType.upsert({
      where: { name: c.name },
      update: { nameVi: c.nameVi ?? c.name, parentId },
      create: {
        name: c.name,
        nameVi: c.nameVi ?? c.name,
        parentId,
      },
    });
  }

  const total = await prisma.productType.count();
}

async function seedSizeOptions() {
  // @@unique([sizeLabel, sortOrder], name: "sizeLabel_sortOrder")
  for (const s of sizeOptions) {
    await prisma.sizeOption.upsert({
      where: {
        sizeLabel_sortOrder: {
          sizeLabel: s.sizeLabel,
          sortOrder: s.sortOrder,
        },
      },
      update: {
        us: s.us ?? null,
        uk: s.uk ?? null,
        kr: s.kr ?? null,
        jp: s.jp ?? null,
        eu: s.eu ?? null,
      },
      create: {
        sortOrder: s.sortOrder,
        sizeLabel: s.sizeLabel,
        us: s.us ?? null,
        uk: s.uk ?? null,
        kr: s.kr ?? null,
        jp: s.jp ?? null,
        eu: s.eu ?? null,
      },
    });
  }

  const total = await prisma.sizeOption.count();
}

async function seedEcoImpact() {
  for (const row of ecoImpactData) {
    const groupEn = GROUP_MAP[row.productGroup] ?? row.productGroup;

    // Tìm ProductType cha theo name EN
    const pt = await prisma.productType.findUnique({
      where: { name: groupEn },
      select: { id: true },
    });

    await prisma.ecoImpact.upsert({
      where: { productGroup: groupEn }, // @unique
      update: {
        glassesOfWater: row.glassesOfWater,
        hoursOfLighting: row.hoursOfLighting,
        kmsOfDriving: row.kmsOfDriving,
        productTypeId: pt?.id ?? null, // 1-1 với ProductType cha
      },
      create: {
        productGroup: groupEn,
        glassesOfWater: row.glassesOfWater,
        hoursOfLighting: row.hoursOfLighting,
        kmsOfDriving: row.kmsOfDriving,
        productTypeId: pt?.id ?? null,
      },
    });
  }

  const total = await prisma.ecoImpact.count();
}

async function main() {
  await seedProductTypes();
  await seedSizeOptions();
  await seedEcoImpact();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
