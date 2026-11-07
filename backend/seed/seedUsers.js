import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { usersToSeed, seedPasswordFor } from "./usersData.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env") });

const seedUsers = async () => {
  try {
    // Read every password before deleting anything, so a missing setting
    // can't leave the database with no users.
    const passwords = usersToSeed.map((u) => seedPasswordFor(u));

    await connectDB();

    console.log("🗑 Clearing all existing users...");
    await User.deleteMany({});
    console.log("✅ Existing users cleared.");

    console.log("\n🌱 Seeding fresh users...");
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds);

    const createdUsers = [];

    for (const [i, u] of usersToSeed.entries()) {
      const hashedPassword = await bcrypt.hash(passwords[i], salt);
      const user = await User.create({
        fullName: u.fullName,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        department: u.department,
        status: "Active",
        mustChangePassword: false,
      });
      createdUsers.push({
        role: u.role,
        fullName: u.fullName,
        email: u.email,
      });
    }

    console.log(`\n🎉 Successfully seeded ${createdUsers.length} users!\n`);
    console.table(createdUsers);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedUsers();
