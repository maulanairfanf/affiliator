import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

import { PrismaClient } from "../../src/generated/prisma/client";

export const prisma = new PrismaClient();
