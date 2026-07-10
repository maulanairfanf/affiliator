import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@affiliator.local";
  const password = await bcrypt.hash("admin123", 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`User ${email} already exists`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      password,
    },
  });

  console.log(`Created user: ${email} / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
