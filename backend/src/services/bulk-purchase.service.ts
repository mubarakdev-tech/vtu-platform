import { purchaseAirtime } from "./airtime.service";
import { buyData } from "./data.service";
import AppError from "../utils/AppError";

const MIN_RECIPIENTS = 1;
const MAX_RECIPIENTS = 100;

type BulkAirtimeRecipient = {
  network: string;
  phone: string;
  amount: number;
};

type BulkDataRecipient = {
  network: string;
  phone: string;
  plan: string;
};

type BulkRecipientResult = {
  index: number;
  phone: string;
  success: boolean;
  message: string;
};

const validateRecipientCount = (recipients: unknown[]) => {
  if (
    recipients.length < MIN_RECIPIENTS ||
    recipients.length > MAX_RECIPIENTS
  ) {
    throw new AppError(
      `Bulk purchase requires between ${MIN_RECIPIENTS} and ${MAX_RECIPIENTS} recipients.`,
      400
    );
  }
};

export const purchaseBulkAirtime = async ({
  userId,
  recipients,
}: {
  userId: string;
  recipients: BulkAirtimeRecipient[];
}) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!Array.isArray(recipients)) {
    throw new AppError("Recipients must be an array.", 400);
  }

  validateRecipientCount(recipients);

  const batchReference =
    `BULK-AIRTIME-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

  const results: BulkRecipientResult[] = [];

  for (let index = 0; index < recipients.length; index += 1) {
    const recipient = recipients[index];

    try {
      const network = String(recipient?.network || "")
        .toLowerCase()
        .trim();

      const phone = String(recipient?.phone || "").trim();
      const amount = Number(recipient?.amount);

      if (
        !network ||
        !phone ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        results.push({
          index,
          phone,
          success: false,
          message: "Invalid airtime recipient details.",
        });
        continue;
      }

      const result: any = await purchaseAirtime({
        userId,
        network,
        phone,
        amount,
        batchReference,
      });

      results.push({
        index,
        phone,
        success: Boolean(result?.success),
        message:
          result?.message ||
          (result?.success
            ? "Airtime purchase successful."
            : "Airtime purchase failed."),
      });
    } catch (error: any) {
      results.push({
        index,
        phone: String(recipient?.phone || "").trim(),
        success: false,
        message:
          error?.message || "Airtime purchase failed.",
      });
    }
  }

  const successful = results.filter(
    (item) => item.success
  ).length;

  return {
    success: successful === results.length,
    batchReference,
    partialSuccess:
      successful > 0 && successful < results.length,
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
};

export const purchaseBulkData = async ({
  userId,
  recipients,
}: {
  userId: string;
  recipients: BulkDataRecipient[];
}) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!Array.isArray(recipients)) {
    throw new AppError("Recipients must be an array.", 400);
  }

  validateRecipientCount(recipients);

  const batchReference =
    `BULK-DATA-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

  const results: BulkRecipientResult[] = [];

  for (let index = 0; index < recipients.length; index += 1) {
    const recipient = recipients[index];

    try {
      const network = String(recipient?.network || "")
        .toLowerCase()
        .trim();

      const phone = String(recipient?.phone || "").trim();
      const plan = String(recipient?.plan || "").trim();

      if (!network || !phone || !plan) {
        results.push({
          index,
          phone,
          success: false,
          message: "Invalid data recipient details.",
        });
        continue;
      }

      const result: any = await buyData({
        userId,
        network,
        phone,
        plan,
        batchReference,
      });

      results.push({
        index,
        phone,
        success: Boolean(result?.success),
        message:
          result?.message ||
          (result?.success
            ? "Data purchase successful."
            : "Data purchase failed."),
      });
    } catch (error: any) {
      results.push({
        index,
        phone: String(recipient?.phone || "").trim(),
        success: false,
        message:
          error?.message || "Data purchase failed.",
      });
    }
  }

  const successful = results.filter(
    (item) => item.success
  ).length;

  return {
    success: successful === results.length,
    batchReference,
    partialSuccess:
      successful > 0 && successful < results.length,
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
};