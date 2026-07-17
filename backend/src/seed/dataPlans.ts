import mongoose from "mongoose";
import dotenv from "dotenv";
import DataPlan from "../models/dataPlan.model";

dotenv.config();

const plans = [
  { network: "MTN", name: "500MB", amount: 150 },
  { network: "MTN", name: "1GB", amount: 300 },
  { network: "MTN", name: "2GB", amount: 600 },

  { network: "Airtel", name: "500MB", amount: 150 },
  { network: "Airtel", name: "1GB", amount: 300 },
  { network: "Airtel", name: "2GB", amount: 600 },

  { network: "Glo", name: "500MB", amount: 150 },
  { network: "Glo", name: "1GB", amount: 300 },

  { network: "9mobile", name: "500MB", amount: 150 },
  { network: "9mobile", name: "1GB", amount: 300 }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  await DataPlan.deleteMany();

  await DataPlan.insertMany(plans);

  console.log("✅ Data plans seeded");

  process.exit();
}

seed();