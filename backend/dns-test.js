import dns from "node:dns/promises";

const host = "certivault.waxqyuw.mongodb.net";

try {
  const records = await dns.resolveSrv("_mongodb._tcp." + host);
  console.log(records);
} catch (err) {
  console.error(err);
}

