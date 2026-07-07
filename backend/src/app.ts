import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import walletRoutes from "./routes/wallet.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VTU Platform API is running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);

export default app;