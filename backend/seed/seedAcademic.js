import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import School from "../models/School.js";
import Department from "../models/Department.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env") });

const seedAcademic = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding default Schools & Departments...");

    // Default Schools
    const schoolsData = [
      {
        name: "School of Information and Communication Technology",
        code: "SICT",
        description: "Faculties of Computing, IT, Telecoms, and Cyber Systems",
      },
      {
        name: "School of Engineering and Engineering Technology",
        code: "SEET",
        description: "Electrical, Mechanical, Civil, and Computer Engineering",
      },
      {
        name: "School of Science and Technology Education",
        code: "SSTE",
        description: "Science Education and Educational Technology",
      },
      {
        name: "School of Environmental Technology",
        code: "SET",
        description: "Architecture, Building, Quantity Surveying, Urban Planning",
      },
    ];

    const createdSchools = {};
    for (const sData of schoolsData) {
      let school = await School.findOne({ code: sData.code });
      if (!school) {
        school = await School.create(sData);
        console.log(`  + Created School: ${school.name} (${school.code})`);
      } else {
        console.log(`  = School exists: ${school.code}`);
      }
      createdSchools[school.code] = school;
    }

    // Default Departments
    const departmentsData = [
      { name: "Computer Science", code: "CSC", schoolCode: "SICT" },
      { name: "Cybersecurity", code: "CYB", schoolCode: "SICT" },
      { name: "Information Technology", code: "IFT", schoolCode: "SICT" },
      { name: "Telecommunication Engineering", code: "TCE", schoolCode: "SICT" },
      { name: "Electrical & Electronics Engineering", code: "EEE", schoolCode: "SEET" },
      { name: "Mechanical Engineering", code: "MEE", schoolCode: "SEET" },
      { name: "Mechatronics Engineering", code: "MTE", schoolCode: "SEET" },
      { name: "Architecture", code: "ARC", schoolCode: "SET" },
      { name: "Building Technology", code: "BLD", schoolCode: "SET" },
    ];

    for (const dData of departmentsData) {
      const school = createdSchools[dData.schoolCode];
      if (!school) continue;

      let dept = await Department.findOne({ name: dData.name, schoolId: school._id });
      if (!dept) {
        dept = await Department.create({
          name: dData.name,
          code: dData.code,
          schoolId: school._id,
          schoolName: school.name,
        });
        console.log(`  + Created Dept: ${dept.name} under ${school.code}`);
      } else {
        console.log(`  = Dept exists: ${dept.name}`);
      }
    }

    console.log("✅ Academic structure seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedAcademic();
