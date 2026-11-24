import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ALL_PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSION_MATRIX,
  ROLES,
  type RoleName,
} from "@techforge/shared";
import { seedMasterData } from "./seedMasterData";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

/** One demo user per role. Email prefix → role. */
const DEMO_USERS: { role: RoleName; email: string; firstName: string; lastName: string }[] = [
  { role: ROLES.ADMIN, email: "admin@techforge.dev", firstName: "Aarav", lastName: "Sharma" },
  { role: ROLES.PRODUCTION_MANAGER, email: "pm@techforge.dev", firstName: "Priya", lastName: "Nair" },
  { role: ROLES.QUALITY_INSPECTOR, email: "qc@techforge.dev", firstName: "Rohit", lastName: "Verma" },
  { role: ROLES.PURCHASE_MANAGER, email: "purchase@techforge.dev", firstName: "Neha", lastName: "Gupta" },
  { role: ROLES.STORE_MANAGER, email: "store@techforge.dev", firstName: "Vikram", lastName: "Singh" },
  { role: ROLES.SALES_EXECUTIVE, email: "sales@techforge.dev", firstName: "Ananya", lastName: "Iyer" },
  { role: ROLES.OPERATOR, email: "operator@techforge.dev", firstName: "Kabir", lastName: "Khan" },
  { role: ROLES.HR, email: "hr@techforge.dev", firstName: "Meera", lastName: "Joshi" },
  { role: ROLES.FINANCE, email: "finance@techforge.dev", firstName: "Arjun", lastName: "Rao" },
];

async function main() {
  console.log("🌱 Seeding TechForge ERP…");

  // 1) Permissions (global catalogue) — upsert every known permission key.
  for (const key of ALL_PERMISSIONS) {
    const [resource, action] = key.split(":");
    await prisma.permission.upsert({
      where: { key },
      update: { resource, action },
      create: { key, resource, action },
    });
  }
  const permissions = await prisma.permission.findMany();
  const permIdByKey = new Map(permissions.map((p) => [p.key, p.id]));

  // 2) Company
  const company = await prisma.company.upsert({
    where: { id: "techforge" },
    update: {},
    create: {
      id: "techforge",
      name: "TechForge Manufacturing Pvt. Ltd.",
      legalName: "TechForge Manufacturing Private Limited",
      taxId: "29ABCDE1234F1Z5",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  // 3) Roles + role→permission matrix
  const roleIdByName = new Map<RoleName, string>();
  for (const roleName of Object.values(ROLES) as RoleName[]) {
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: roleName } },
      update: { description: ROLE_LABELS[roleName] },
      create: {
        companyId: company.id,
        name: roleName,
        description: ROLE_LABELS[roleName],
        isSystem: true,
      },
    });
    roleIdByName.set(roleName, role.id);

    // Reset and apply the matrix for idempotent seeds.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const keys = ROLE_PERMISSION_MATRIX[roleName];
    await prisma.rolePermission.createMany({
      data: keys
        .map((k) => permIdByKey.get(k))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }

  // 4) Demo users (one per role)
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { companyId_email: { companyId: company.id, email: u.email } },
      update: { roleId: roleIdByName.get(u.role)!, firstName: u.firstName, lastName: u.lastName },
      create: {
        companyId: company.id,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: roleIdByName.get(u.role)!,
      },
    });
  }

  // 5) Master data + opening stock (Phase 2)
  const md = await seedMasterData(prisma, company.id);

  console.log("✅ Seed complete.");
  console.log(`   Company: ${company.name}`);
  console.log(`   Users:   ${DEMO_USERS.length} (one per role)`);
  console.log(
    `   Data:    ${md.customers} customers, ${md.suppliers} suppliers, ${md.products} products, ` +
      `${md.rawMaterials} materials, ${md.warehouses} warehouses, ${md.boms} BOMs + opening stock`,
  );
  console.log(`   Login:   admin@techforge.dev / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
