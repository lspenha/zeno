import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import https from "https";

/**
 * Detecta qual gerenciador de pacotes está sendo usado no projeto.
 */
async function detectPackageManager(): Promise<"npm" | "yarn" | "pnpm"> {
  const hasYarn = await fs.pathExists("yarn.lock");
  const hasPnpm = await fs.pathExists("pnpm-lock.yaml");

  if (hasYarn) return "yarn";
  if (hasPnpm) return "pnpm";
  return "npm";
}

/**
 * Analisa os imports de um arquivo e retorna uma lista de dependências externas (nome dos pacotes).
 */
async function extractUsedPackages(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, "utf8");

  const regex = /import\s+(?:[^'"]+\s+from\s+)?["'](@?[\w-./]+)["']/g;
  const matches = [...content.matchAll(regex)];

  const packages = matches.map((match) => {
    const raw = match[1];
    if (raw.startsWith("@")) {
      const [scope, name] = raw.split("/");
      return `${scope}/${name}`;
    }
    return raw.split("/")[0];
  });

  return [...new Set(packages)];
}

/**
 * Gera um componente React local baseado em um arquivo do monorepo
 * e instala apenas as dependências necessárias.
 */
export async function generateComponent(name: string) {
  const componentName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = name.toLowerCase();

  const remoteUrl = `https://raw.githubusercontent.com/lspenha/zeno/refs/heads/main/packages/ui/src/${fileName}.tsx`;

  // Novo caminho: src/components/ui/Componente.tsx
  const componentDir = path.resolve("src/components/ui");
  const destinationPath = path.join(componentDir, `${componentName}.tsx`);

  const alreadyInstalled = await fs.pathExists(destinationPath);

  if (!alreadyInstalled) {
    await fs.ensureDir(componentDir);

    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(destinationPath);
      https.get(remoteUrl, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destinationPath).catch(() => {});
          reject(new Error(`❌ Componente não encontrado`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }).on("error", (err) => {
        file.close();
        fs.unlink(destinationPath).catch(() => {});
        reject(err);
      });
    });

    // Removido: criação de index.ts por componente

    // Mantém registro no index central, se desejar:
    const centralIndexPath = path.resolve("src/components/index.ts");
    const exportLine = `export * from './ui/${componentName}';\n`;
    const alreadyExists = await fs.pathExists(centralIndexPath);
    const centralContent = alreadyExists
      ? await fs.readFile(centralIndexPath, "utf8")
      : "";

    if (!centralContent.includes(`./ui/${componentName}`)) {
      await fs.appendFile(centralIndexPath, exportLine);
    }

    console.log(`✅ Componente ${componentName} adicionado a src/components/ui/`);
  } else {
    console.log(`ℹ️ Componente ${componentName} já existe. Nada foi feito.`);
  }

  // 🔍 Analisa imports e instala dependências usadas
  try {
    const usedPackages = await extractUsedPackages(destinationPath);

    const pkgPath = path.resolve("package.json");
    const pkgJson = await fs.readJSON(pkgPath);
    const currentDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
    };

    const missingDeps = usedPackages.filter((dep) => !currentDeps?.[dep]);

    if (missingDeps.length > 0) {
      const pkgManager = await detectPackageManager();
      console.log(`📦 Instalando dependências: ${missingDeps.join(", ")}`);

      const installCmd =
        pkgManager === "yarn"
          ? `yarn add ${missingDeps.join(" ")}`
          : pkgManager === "pnpm"
          ? `pnpm add ${missingDeps.join(" ")}`
          : `npm install ${missingDeps.join(" ")}`;

      execSync(installCmd, { stdio: "inherit" });
      console.log("✅ Dependências instaladas com sucesso.");
    } else {
      console.log("✅ Todas as dependências já estão instaladas.");
    }
  } catch (error) {
    console.error("❌ Erro ao verificar ou instalar dependências:", error);
  }
}
