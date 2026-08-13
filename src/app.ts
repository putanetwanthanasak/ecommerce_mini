import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import categoryRoutes from "./routes/categories";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import { errorHandler } from "./middleware/errorHandler";

// The configured app with no .listen() — index.ts binds the port, Supertest
// imports this directly so the suite never occupies one.
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Must be registered LAST — after all routes
app.use(errorHandler);

export default app;
