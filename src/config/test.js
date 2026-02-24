import redis from "./redis.js";


await redis.set("test_key", "hello");
const value = await redis.get("test_key");

console.log(value);