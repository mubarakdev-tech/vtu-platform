import { Request, Response, NextFunction } from "express";
import { previewBigiSubCatalogueSync } from "../services/provider-catalogue-sync.service";

export const previewBigiSubCatalogueSyncController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await previewBigiSubCatalogueSync();
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
