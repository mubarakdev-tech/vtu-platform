import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VTU Platform API is running",
  });
});

// routes
app.use("/api/auth", authRoutes);

export default app;