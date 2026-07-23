import axios from "axios";

async function test() {
  try {
    const res = await axios.post(
      "https://sandbox.vtpass.com/api/pay",
      {
        request_id: "12345678901234567890",
        serviceID: "mtn",
        amount: 100,
        phone: "08031234567",
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECURITY_KEY,
        },
      }
    );

    console.log(res.data);
  } catch (err: any) {
    console.log("ERROR:", err.message);
    console.log(err.response?.data);
  }
}

test();