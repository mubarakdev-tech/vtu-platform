/**
 * ==========================================
 * PAYSTACK CUSTOMER FEE SERVICE
 * ==========================================
 *
 * Calculates the amount a customer needs to
 * pay when AbuPay passes Paystack's payment
 * processing fee to the customer.
 *
 * Nigeria Paystack pricing:
 *
 * Transactions below ₦2,500:
 * 1.5%
 *
 * Transactions ₦2,500 and above:
 * 1.5% + ₦100
 *
 * Local transaction fee is capped at ₦2,000.
 *
 * Paystack's customer-pays calculation uses
 * a gross-up formula because the percentage
 * fee is also applied to the additional amount
 * passed to the customer.
 */

interface PaystackFeeResult {
  fundingAmount: number;
  estimatedFee: number;
  estimatedTotal: number;
  feeRate: number;
  flatFee: number;
}

/**
 * ==========================================
 * PAYSTACK NIGERIA CONSTANTS
 * ==========================================
 */

const PAYSTACK_PERCENTAGE_FEE = 0.015;

const PAYSTACK_FLAT_FEE = 100;

const PAYSTACK_FEE_CAP = 2000;

const PAYSTACK_FLAT_FEE_WAIVER_LIMIT = 2500;

/**
 * ==========================================
 * ROUND TO 2 DECIMAL PLACES
 * ==========================================
 */

const roundToTwo = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * ==========================================
 * CALCULATE PAYSTACK CUSTOMER FEE
 * ==========================================
 *
 * The amount passed into this function is
 * the amount AbuPay wants to credit to the
 * customer's wallet.
 *
 * Example:
 *
 * Wallet funding: ₦1,000
 *
 * Paystack fee:
 * approximately ₦15.24
 *
 * Customer pays:
 * approximately ₦1,015.24
 *
 * AbuPay wallet receives:
 * ₦1,000
 */

export const calculatePaystackCustomerFee = (
  fundingAmount: number
): PaystackFeeResult => {
  /**
   * ========================================
   * VALIDATION
   * ========================================
   */

  if (
    !Number.isFinite(fundingAmount) ||
    fundingAmount <= 0
  ) {
    throw new Error(
      "Invalid funding amount"
    );
  }

  /**
   * ========================================
   * DETERMINE FLAT FEE
   * ========================================
   *
   * Paystack waives the ₦100 flat fee for
   * transactions below ₦2,500.
   */

  const flatFee =
    fundingAmount < PAYSTACK_FLAT_FEE_WAIVER_LIMIT
      ? 0
      : PAYSTACK_FLAT_FEE;

  /**
   * ========================================
   * CALCULATE CUSTOMER TOTAL
   * ========================================
   *
   * Paystack customer-pays-fee formula:
   *
   * Final Amount =
   *
   * ((Price + Flat Fee) /
   * (1 - Percentage Fee))
   *
   * + 0.01
   *
   * This accounts for the fact that the
   * percentage fee is charged against the
   * total amount paid by the customer.
   */

  const rawTotal =
    (
      (fundingAmount + flatFee) /
      (1 - PAYSTACK_PERCENTAGE_FEE)
    ) + 0.01;

  /**
   * Round to Kobo / 2 decimal places.
   */

  let estimatedTotal =
    roundToTwo(rawTotal);

  /**
   * ========================================
   * CALCULATE FEE
   * ========================================
   */

  let estimatedFee =
    roundToTwo(
      estimatedTotal - fundingAmount
    );

  /**
   * ========================================
   * APPLY PAYSTACK FEE CAP
   * ========================================
   *
   * Paystack's local transaction fee is
   * capped at ₦2,000.
   *
   * We normally won't hit this for the
   * smaller wallet amounts, but keeping
   * the cap here protects the calculation.
   */

  if (
    estimatedFee > PAYSTACK_FEE_CAP
  ) {
    estimatedFee =
      PAYSTACK_FEE_CAP;

    estimatedTotal =
      roundToTwo(
        fundingAmount +
          estimatedFee
      );
  }

  /**
   * ========================================
   * RETURN RESULT
   * ========================================
   */

  return {
    fundingAmount:
      roundToTwo(fundingAmount),

    estimatedFee,

    estimatedTotal,

    feeRate:
      PAYSTACK_PERCENTAGE_FEE,

    flatFee,
  };
};