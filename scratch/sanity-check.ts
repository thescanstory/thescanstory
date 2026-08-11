import fs from "fs";

async function sanityCheck() {
  console.log("Running Backend/API Sanity Check...");
  
  const baseUrl = "http://localhost:3000";

  // 1. Check Homepage
  const homeRes = await fetch(`${baseUrl}/`);
  console.log(`Homepage Status: ${homeRes.status}`);
  if (homeRes.status !== 200) throw new Error("Homepage failed");

  // 2. Fetch products to get a valid product ID
  console.log("Checking DB connection via admin metrics...");
  // Note: Since we are running locally without an auth token, we might not be able to hit admin endpoints directly unless we simulate auth.
  // Instead, let's hit a public route that interacts with DB, or write a direct db query.
  
}
sanityCheck().catch(console.error);
