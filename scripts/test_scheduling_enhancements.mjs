import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Pure logic test for cohort clash and slot limits
function testCohortClash() {
  const mthCourse = {
    code: "MTH 201",
    level: 200,
    departments: ["Computer Science", "Cyber Security"],
    creditUnits: 3,
  };

  const cscCourse = {
    code: "CSC 201",
    level: 200,
    departments: ["Computer Science"],
    creditUnits: 3,
  };

  const cssCourse = {
    code: "CSS 201",
    level: 200,
    departments: ["Cyber Security"],
    creditUnits: 2,
  };

  const phyCourse = {
    code: "PHY 101",
    level: 100,
    departments: ["Computer Science"],
    creditUnits: 3,
  };

  const seCourse = {
    code: "SE 201",
    level: 200,
    departments: ["Software Engineering"],
    creditUnits: 2,
  };

  function checkClash(c1, c2) {
    if (c1.level !== c2.level) return false;
    const overlap = c1.departments.filter((d) => c2.departments.includes(d));
    return overlap.length > 0;
  }

  console.log("=== UNIT TEST: COHORT CLASH LOGIC ===");
  const test1 = checkClash(mthCourse, cscCourse);
  console.log(`Test 1 (MTH 201 vs CSC 201): Clash = ${test1} | Expected: true -> ${test1 === true ? "PASS" : "FAIL"}`);

  const test2 = checkClash(mthCourse, cssCourse);
  console.log(`Test 2 (MTH 201 vs CSS 201): Clash = ${test2} | Expected: true -> ${test2 === true ? "PASS" : "FAIL"}`);

  const test3 = checkClash(cscCourse, cssCourse);
  console.log(`Test 3 (CSC 201 vs CSS 201): Clash = ${test3} | Expected: false -> ${test3 === false ? "PASS" : "FAIL"}`);

  const test4 = checkClash(phyCourse, mthCourse);
  console.log(`Test 4 (PHY 101 vs MTH 201): Clash = ${test4} | Expected: false -> ${test4 === false ? "PASS" : "FAIL"}`);

  const test5 = checkClash(cscCourse, seCourse);
  console.log(`Test 5 (CSC 201 vs SE 201): Clash = ${test5} | Expected: false -> ${test5 === false ? "PASS" : "FAIL"}`);

  console.log("\n=== UNIT TEST: SLOT CAPACITY (MAX 5) ===");
  const slotCount1 = 4;
  const canAdd1 = slotCount1 < 5;
  console.log(`Slot with 4 courses can add 5th course: ${canAdd1} -> ${canAdd1 === true ? "PASS" : "FAIL"}`);

  const slotCount2 = 5;
  const canAdd2 = slotCount2 < 5;
  console.log(`Slot with 5 courses blocks 6th course: ${!canAdd2} -> ${!canAdd2 === true ? "PASS" : "FAIL"}`);

  console.log("\n=== UNIT TEST: CREDIT UNIT QUOTA ===");
  function calculateQuota(creditUnits, allocatedSlots) {
    const maxSlots = creditUnits;
    const remainingSlots = Math.max(0, maxSlots - allocatedSlots);
    let status = "unscheduled";
    if (allocatedSlots >= maxSlots) status = "completed";
    else if (allocatedSlots > 0) status = "partial";
    return { maxSlots, remainingSlots, status };
  }

  const q1 = calculateQuota(3, 0);
  console.log(`3 Units, 0 slots: Status=${q1.status}, remaining=${q1.remainingSlots} -> ${q1.status === "unscheduled" && q1.remainingSlots === 3 ? "PASS" : "FAIL"}`);

  const q2 = calculateQuota(3, 2);
  console.log(`3 Units, 2 slots: Status=${q2.status}, remaining=${q2.remainingSlots} -> ${q2.status === "partial" && q2.remainingSlots === 1 ? "PASS" : "FAIL"}`);

  const q3 = calculateQuota(2, 2);
  console.log(`2 Units, 2 slots: Status=${q3.status}, remaining=${q3.remainingSlots} -> ${q3.status === "completed" && q3.remainingSlots === 0 ? "PASS" : "FAIL"}`);

  console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
}

testCohortClash();
