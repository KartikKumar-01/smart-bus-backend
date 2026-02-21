import prisma from "./db.js";

async function test() {
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      passwordHash: "123456"
    }
  });

  console.log(user);
}

test();