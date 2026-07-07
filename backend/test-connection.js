const mongoose = require("mongoose");

const uri =
  "mongodb+srv://mustaphamubarak94_db_user:Mbk%40199411782@cluster0.phfbtfn.mongodb.net/vtu-platform?retryWrites=true&w=majority";

mongoose
  .connect(uri)
  .then(() => {
    console.log("✅ MongoDB Connected");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:");
    console.error(err);
    process.exit(1);
  });