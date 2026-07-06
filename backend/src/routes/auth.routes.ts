import { Router, Response } from "express";
import { register, login } from "../controllers/auth.controller";
import { protect, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route
router.get("/me", protect, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export default router;