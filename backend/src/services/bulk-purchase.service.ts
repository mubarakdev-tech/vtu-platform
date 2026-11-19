
import { createHash } from "crypto";
import { purchaseAirtime } from "./airtime.service";
import { buyData } from "./data.service";
import AppError from "../utils/AppError";

const MIN_RECIPIENTS = 2;
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
  status?: "SUCCESS" | "FAILED" | "PENDING";
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

const isValidRequestId = (requestId: unknown): requestId is string => {
  return (
    typeof requestId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId
    )
  );
};

/**
 * Creates a deterministic UUID for one recipient in a bulk Data batch.
 * Repeating the same batch request with the same recipient order and
 * details produces the same recipient request IDs.
 */
const createBulkDataRecipientRequestId = (
  batchRequestId: string,
  index: number,
  network: string,
  phone: string,
  plan: string
): string => {
  const hash = createHash("sha256")
    .update(
      `${batchRequestId.toLowerCase()}:${index}:${network}:${phone}:${plan}`
    )
    .digest("hex")
    .slice(0, 32)
    .split("");

  // Set UUID version 5 and RFC 4122 variant bits.
  hash[12] = "5";
  hash[16] = (parseInt(hash[16], 16) & 0x3 | 0x8).toString(16);

  const value = hash.join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join("-");
};

/**
 * Creates a deterministic UUID for one recipient in a bulk Airtime batch.
 * Repeating the same batch request with the same recipient order and
 * details produces the same recipient request IDs.
 */
const createBulkAirtimeRecipientRequestId = (
  batchRequestId: string,
  index: number,
  network: string,
  phone: string,
  amount: number
): string => {
  const hash = createHash("sha256")
    .update(
      `${batchRequestId.toLowerCase()}:${index}:${network}:${phone}:${amount}`
    )
    .digest("hex")
    .slice(0, 32)
    .split("");

  // Set UUID version 5 and RFC 4122 variant bits.
  hash[12] = "5";
  hash[16] = (parseInt(hash[16], 16) & 0x3 | 0x8).toString(16);

  const value = hash.join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join("-");
};

export const purchaseBulkAirtime = async ({
  userId,
  recipients,
  requestId,
}: {
  userId: string;
  recipients: BulkAirtimeRecipient[];
  requestId: string;
}) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!Array.isArray(recipients)) {
    throw new AppError("Recipients must be an array.", 400);
  }

  validateRecipientCount(recipients);

  if (!isValidRequestId(requestId)) {
    throw new AppError(
      "A valid bulk Airtime request ID is required.",
      400
    );
  }

  const normalizedRequestId = requestId.toLowerCase();

  // Stable across retries of this batch.
  const batchReference = `BULK-AIRTIME-${normalizedRequestId}`;

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
          status: "FAILED",
          message: "Invalid airtime recipient details.",
        });

        continue;
      }

      const recipientRequestId =
        createBulkAirtimeRecipientRequestId(
          normalizedRequestId,
          index,
          network,
          phone,
          amount
        );

      const result: any = await purchaseAirtime({
        userId,
        network,
        phone,
        amount,
        requestId: recipientRequestId,
        batchReference,
      });

      const status =
        result?.status ||
        (result?.success ? "SUCCESS" : "FAILED");

      results.push({
        index,
        phone,
        success: Boolean(result?.success),
        status,
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
        status: "FAILED",
        message:
          error?.message || "Airtime purchase failed.",
      });
    }
  }

  const successful = results.filter(
    (item) => item.success
  ).length;

  const pending = results.filter(
    (item) => item.status === "PENDING"
  ).length;

  const failed = results.filter(
    (item) =>
      !item.success && item.status !== "PENDING"
  ).length;

  return {
    success: successful === results.length,
    batchReference,
    requestId: normalizedRequestId,
    partialSuccess:
      successful > 0 && successful < results.length,
    total: results.length,
    successful,
    pending,
    failed,
    results,
  };
};

export const purchaseBulkData = async ({
  userId,
  recipients,
  requestId,
}: {
  userId: string;
  recipients: BulkDataRecipient[];
  requestId: string;
}) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!Array.isArray(recipients)) {
    throw new AppError("Recipients must be an array.", 400);
  }

  validateRecipientCount(recipients);

  if (!isValidRequestId(requestId)) {
    throw new AppError(
      "A valid bulk Data request ID is required.",
      400
    );
  }

  const normalizedRequestId = requestId.toLowerCase();

  // Stable across retries of this batch.
  const batchReference = `BULK-DATA-${normalizedRequestId}`;

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

      const recipientRequestId =
        createBulkDataRecipientRequestId(
          normalizedRequestId,
          index,
          network,
          phone,
          plan
        );

      const result: any = await buyData({
        userId,
        network,
        phone,
        plan,
        requestId: recipientRequestId,
        batchReference,
      });

      results.push({
        index,
        phone,
        success: Boolean(result?.success),
        status: result?.status || (result?.success ? "SUCCESS" : "FAILED"),
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

  const pending = results.filter(
    (item) => item.status === "PENDING"
  ).length;

  const failed = results.filter(
    (item) =>
      !item.success && item.status !== "PENDING"
  ).length;

  return {
    success: successful === results.length,
    batchReference,
    requestId: normalizedRequestId,
    partialSuccess:
      successful > 0 && successful < results.length,
    total: results.length,
    successful,
    pending,
    failed,
    results,
  };
};
