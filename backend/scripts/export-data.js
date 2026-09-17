import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const backupDir = path.resolve(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return val;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    const arrayElements = val.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
    return `'{${arrayElements}}'`;
  }
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateTableSql(tableName, rows) {
  if (!rows || rows.length === 0) return `-- No data for table ${tableName}\n\n`;
  const columns = Object.keys(rows[0]);
  const sqlLines = [];
  sqlLines.push(`-- Data for table: ${tableName} (${rows.length} rows)`);

  for (const row of rows) {
    const values = columns.map((col) => escapeSqlValue(row[col])).join(", ");
    sqlLines.push(`INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values}) ON CONFLICT DO NOTHING;`);
  }
  sqlLines.push("\n");
  return sqlLines.join("\n");
}

async function exportAll() {
  console.log("🚀 Starting complete database export...");

  try {
    const [
      users,
      courses,
      courseModules,
      courseLessons,
      payments,
      enrollments,
      lessonProgress,
      otps,
      passwordResetTokens,
      tokenBlacklist,
    ] = await Promise.all([
      prisma.user.findMany({ orderBy: { created_at: "asc" } }),
      prisma.course.findMany({ orderBy: { created_at: "asc" } }),
      prisma.courseModule.findMany({ orderBy: { sort_order: "asc" } }),
      prisma.courseLesson.findMany({ orderBy: { sort_order: "asc" } }),
      prisma.payment.findMany({ orderBy: { created_at: "asc" } }),
      prisma.enrollment.findMany({ orderBy: { created_at: "asc" } }),
      prisma.lessonProgress.findMany({ orderBy: { created_at: "asc" } }),
      prisma.otp.findMany({ orderBy: { created_at: "asc" } }),
      prisma.passwordResetToken.findMany({ orderBy: { created_at: "asc" } }),
      prisma.tokenBlacklist.findMany({ orderBy: { created_at: "asc" } }),
    ]);

    const dumpData = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_tables: 10,
        counts: {
          users: users.length,
          courses: courses.length,
          course_modules: courseModules.length,
          course_lessons: courseLessons.length,
          payments: payments.length,
          enrollments: enrollments.length,
          lesson_progress: lessonProgress.length,
          otps: otps.length,
          password_reset_tokens: passwordResetTokens.length,
          token_blacklist: tokenBlacklist.length,
        },
      },
      data: {
        users,
        courses,
        course_modules: courseModules,
        course_lessons: courseLessons,
        payments,
        enrollments,
        lesson_progress: lessonProgress,
        otps,
        password_reset_tokens: passwordResetTokens,
        token_blacklist: tokenBlacklist,
      },
    };

    // 1. Save JSON dump
    const jsonPath = path.join(backupDir, "export-data.json");
    fs.writeFileSync(jsonPath, JSON.stringify(dumpData, null, 2), "utf8");
    console.log(`✅ JSON export saved to: ${jsonPath}`);

    // 2. Generate SQL dump for pgAdmin
    let sqlContent = `-- ========================================================\n`;
    sqlContent += `-- ArchitectureNext Database Export for pgAdmin / PostgreSQL\n`;
    sqlContent += `-- Generated: ${dumpData.metadata.exported_at}\n`;
    sqlContent += `-- ========================================================\n\n`;
    sqlContent += `BEGIN;\n\n`;

    sqlContent += generateTableSql("users", users);
    sqlContent += generateTableSql("courses", courses);
    sqlContent += generateTableSql("course_modules", courseModules);
    sqlContent += generateTableSql("course_lessons", courseLessons);
    sqlContent += generateTableSql("payments", payments);
    sqlContent += generateTableSql("enrollments", enrollments);
    sqlContent += generateTableSql("lesson_progress", lessonProgress);
    sqlContent += generateTableSql("otps", otps);
    sqlContent += generateTableSql("password_reset_tokens", passwordResetTokens);
    sqlContent += generateTableSql("token_blacklist", tokenBlacklist);

    sqlContent += `COMMIT;\n`;

    const sqlPath = path.join(backupDir, "export-data.sql");
    fs.writeFileSync(sqlPath, sqlContent, "utf8");
    console.log(`✅ SQL export for pgAdmin saved to: ${sqlPath}`);

    console.log("\n📊 Export Summary:");
    console.table(dumpData.metadata.counts);
  } catch (err) {
    console.error("❌ Export failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportAll();
