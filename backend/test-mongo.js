const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://mustaphamubarak94_db_user:Mbk%40199411782@cluster0.phfbtfn.mongodb.net/vtu-platform?retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting...");
    await client.connect();
    console.log("✅ Connected successfully!");
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err);
  } finally {
    await client.close();
  }
}

main();