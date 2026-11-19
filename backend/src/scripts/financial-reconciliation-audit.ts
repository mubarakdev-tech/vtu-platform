
import mongoose from "mongoose";
import env from "../config/env";
import Transaction from "../models/transaction.model";
import FinancialLedger from "../models/financialLedger.model";
import User from "../models/user.model";

const id = (value: any) => value?.toString() || "";

const hasCost = (value: any) =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  Number.isFinite(Number(value));

async function runAudit() {
  try {
    console.log("\nABUPAY FINANCIAL RECONCILIATION AUDIT");
    console.log("READ-ONLY MODE");
    console.log("Connecting to database...\n");

    await mongoose.connect(env.MONGO_URI);

    const [transactions, ledgers, users] = await Promise.all([
      Transaction.find({}).lean(),
      FinancialLedger.find({}).lean(),
      User.find({}).select("_id isTest").lean(),
    ]);

    const userTestMap = new Map(
      users.map((u: any) => [id(u._id), u.isTest === true])
    );

    const transactionTest = (tx: any) =>
      tx.metadata?.isTest === true ||
      userTestMap.get(id(tx.user)) === true;

    const ledgerTest = (entry: any) =>
      entry.metadata?.isTest === true ||
      userTestMap.get(id(entry.user)) === true ||
      transactionTestMap.get(id(entry.transaction)) === true;

    const transactionTestMap = new Map(
      transactions.map((tx: any) => [
        id(tx._id),
        transactionTest(tx),
      ])
    );

    const productionTransactions = transactions.filter(
      (tx: any) => !transactionTest(tx)
    );

    const productionLedgers = ledgers.filter(
      (entry: any) => !ledgerTest(entry)
    );

    const linkedLedgers = new Map<string, any[]>();

    for (const entry of productionLedgers) {
      const transactionId = id(entry.transaction);

      if (!transactionId) continue;

      const existing = linkedLedgers.get(transactionId) || [];
      existing.push(entry);
      linkedLedgers.set(transactionId, existing);
    }

    const serviceTransactions = productionTransactions.filter(
      (tx: any) =>
        tx.type === "DEBIT" &&
        tx.status === "SUCCESS" &&
        ["AIRTIME", "DATA"].includes(tx.category)
    );

    const sales = {
      AIRTIME: { total: 0, matched: 0, missing: 0 },
      DATA: { total: 0, matched: 0, missing: 0 },
    };

    const missingSales: string[] = [];
    const missingProviderCosts: string[] = [];

    for (const tx of serviceTransactions) {
      const category =
        tx.category === "AIRTIME"
          ? "AIRTIME_SALE"
          : "DATA_SALE";

      const linked = linkedLedgers.get(id(tx._id)) || [];

      const sale = linked.find(
        (entry) => entry.category === category
      );

      const key = tx.category as "AIRTIME" | "DATA";

      sales[key].total++;

      if (!sale) {
        sales[key].missing++;
        missingSales.push(id(tx._id));
        missingProviderCosts.push(
          `Sale missing: ${id(tx._id)}`
        );
        continue;
      }

      sales[key].matched++;

      const providerCostEntry = linked.some(
        (entry) =>
          entry.category === "PROVIDER_COST" &&
          Number(entry.amount) > 0
      );

      const costAvailable =
        hasCost(sale.providerCost) ||
        hasCost(tx.metadata?.providerCost) ||
        providerCostEntry;

      if (!costAvailable) {
        missingProviderCosts.push(id(tx._id));
      }
    }

    // Refund reconciliation
    const refunds = productionTransactions.filter(
      (tx: any) => tx.category === "REFUND"
    );

    let refundMatched = 0;
    const missingRefunds: string[] = [];

    for (const tx of refunds) {
      const linked = linkedLedgers.get(id(tx._id)) || [];

      if (linked.some((entry) => entry.category === "REFUND")) {
        refundMatched++;
      } else {
        missingRefunds.push(id(tx._id));
      }
    }

    // Duplicate financial ledger references
    const referenceCounts = new Map<string, number>();

    for (const entry of productionLedgers) {
      if (!entry.reference) continue;

      const reference = String(entry.reference);
      referenceCounts.set(
        reference,
        (referenceCounts.get(reference) || 0) + 1
      );
    }

    const duplicateReferences = [...referenceCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([reference, count]) => ({ reference, count }));

    // Wallet funding and Paystack fees
    const fundingTransactions = productionTransactions.filter(
      (tx: any) =>
        tx.type === "CREDIT" &&
        tx.category === "WALLET_FUNDING" &&
        tx.status === "SUCCESS"
    );

    const paystackFees = productionLedgers.filter(
      (entry: any) =>
        entry.category === "PAYSTACK_FEE"
    );

    let fundingWithFee = 0;
    const fundingWithoutFee: string[] = [];
    const matchedFeeIds = new Set<string>();

    for (const tx of fundingTransactions) {
      const gatewayReference = String(tx.gatewayReference || "");

      const fee = paystackFees.find((entry: any) =>
        id(entry.transaction) === id(tx._id) ||
        (
          gatewayReference &&
          entry.reference === `PAYSTACK_FEE:${gatewayReference}`
        )
      );

      if (fee) {
        fundingWithFee++;
        matchedFeeIds.add(id(fee._id));
      } else {
        fundingWithoutFee.push(id(tx._id));
      }
    }

    // Test-account and test-transaction counts
    const testAccounts = users.filter(
      (u: any) => u.isTest === true
    ).length;

    const testTransactions = transactions.filter(
      (tx: any) => transactionTest(tx)
    ).length;

    const metadataTestTransactions = transactions.filter(
      (tx: any) => tx.metadata?.isTest === true
    ).length;

    const testLedgers = ledgers.filter(
      (entry: any) => ledgerTest(entry)
    ).length;

    const report = {
      mode: "READ ONLY",
      databaseConnected: mongoose.connection.readyState === 1,

      records: {
        transactions: transactions.length,
        financialLedgers: ledgers.length,
        users: users.length,
        productionTransactions: productionTransactions.length,
        productionLedgers: productionLedgers.length,
      },

      serviceSales: sales,

      providerCosts: {
        eligiblePurchases: serviceTransactions.length,
        missingProviderCost: missingProviderCosts.length,
        missingReferences: missingProviderCosts,
      },

      refunds: {
        total: refunds.length,
        matched: refundMatched,
        missing: missingRefunds.length,
        missingReferences: missingRefunds,
      },

      duplicateLedgerReferences: duplicateReferences,

      walletFunding: {
        successfulFundingTransactions: fundingTransactions.length,
        paystackFeeEntries: paystackFees.length,
        fundingWithFee: fundingWithFee,
        fundingWithoutFee: fundingWithoutFee.length,
        unmatchedFundingReferences: fundingWithoutFee,
        unmatchedFeeEntries: paystackFees.filter(
          (entry: any) => !matchedFeeIds.has(id(entry._id))
        ).length,
        note: "Principal wallet funding is not expected to have a separate WALLET_FUNDING ledger entry.",
      },

      testRecords: {
        testAccounts,
        testTransactions,
        metadataTestTransactions,
        testLedgers,
      },

      missingSales,
    };

    console.log("\n========== AUDIT REPORT ==========\n");
    console.log(JSON.stringify(report, null, 2));
    console.log("\n========== AUDIT COMPLETE ==========\n");

  } catch (error) {
    console.error("AUDIT FAILED:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

runAudit();
