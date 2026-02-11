#!/usr/bin/env -S deno run --allow-read --allow-env

/**
 * Script de verificación para asegurar que el proyecto está
 * correctamente configurado para Deno Deploy
 */

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, message: string) {
  results.push({ name, passed: condition, message });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

console.log("🔍 Verificando configuración para Deno Deploy...\n");

// Check 1: deno.json existe
const denoJsonExists = await fileExists("deno.json");
check(
  "deno.json",
  denoJsonExists,
  denoJsonExists ? "✓ Archivo encontrado" : "✗ Archivo no encontrado"
);

// Check 2: server.ts existe
const serverTsExists = await fileExists("server.ts");
check(
  "server.ts",
  serverTsExists,
  serverTsExists ? "✓ Punto de entrada encontrado" : "✗ Punto de entrada no encontrado"
);

// Check 3: package.json tiene @react-router/deno
if (await fileExists("package.json")) {
  const packageJson = JSON.parse(await Deno.readTextFile("package.json"));
  const hasDenoAdapter = packageJson.dependencies?.["@react-router/deno"];
  check(
    "@react-router/deno",
    !!hasDenoAdapter,
    hasDenoAdapter
      ? "✓ Dependencia encontrada"
      : "✗ Falta @react-router/deno en dependencies"
  );
}

// Check 4: Variables de entorno requeridas
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "SESSION_SECRET"];
const envFile = await fileExists(".env");

if (envFile) {
  const envContent = await Deno.readTextFile(".env");
  for (const varName of requiredEnvVars) {
    const hasVar = envContent.includes(`${varName}=`);
    check(
      `ENV: ${varName}`,
      hasVar,
      hasVar ? "✓ Variable definida en .env" : `⚠ Variable ${varName} no encontrada`
    );
  }
} else {
  check("archivo .env", false, "⚠ Archivo .env no encontrado (usar .env.example)");
}

// Check 5: Build directory
const buildExists = await fileExists("build");
check(
  "build/",
  buildExists,
  buildExists
    ? "✓ Build encontrado (listo para deploy)"
    : "⚠ Build no encontrado (ejecuta: deno task build)"
);

// Imprimir resultados
console.log("\n📊 Resultados:\n");

let allPassed = true;
for (const result of results) {
  const icon = result.passed ? GREEN : result.message.includes("⚠") ? YELLOW : RED;
  console.log(`${icon}${result.message}${RESET}`);
  if (!result.passed && !result.message.includes("⚠")) {
    allPassed = false;
  }
}

console.log("\n");

if (allPassed) {
  console.log(`${GREEN}✓ Todo listo para desplegar en Deno Deploy!${RESET}`);
  console.log("\nSiguientes pasos:");
  console.log("1. deno task build");
  console.log("2. deployctl deploy --project=tu-proyecto server.ts");
} else {
  console.log(`${RED}✗ Hay problemas que resolver antes del deploy${RESET}`);
  Deno.exit(1);
}
