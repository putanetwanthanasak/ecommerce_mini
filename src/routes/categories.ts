import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Trim first, then check length — " " must fail, not pass as 1 character
const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

// POST /api/categories
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name } = categorySchema.parse(req.body);

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    const category = await prisma.category.create({ data: { name } });

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories — public
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });

    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/categories/:id
router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    // Express 5 types params as string | string[]; this route only ever has one :id
    const { id } = req.params as { id: string };
    const { name } = categorySchema.parse(req.body);

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Taken by a *different* category — renaming to its own name is a no-op, not a conflict
    const conflict = await prisma.category.findUnique({ where: { name } });
    if (conflict && conflict.id !== id) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json({ category: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    // Express 5 types params as string | string[]; this route only ever has one :id
    const { id } = req.params as { id: string };

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Products reference categories with a required FK — deleting would orphan them
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(409).json({ error: "Cannot delete category with existing products" });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
