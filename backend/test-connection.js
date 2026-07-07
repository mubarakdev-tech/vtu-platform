require("dotenv").config();

const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

async function test() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

test();