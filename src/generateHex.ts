import crypto from "node:crypto";

const randomString = crypto.randomBytes(64).toString("hex");

console.log(randomString);
console.log(randomString.length);
