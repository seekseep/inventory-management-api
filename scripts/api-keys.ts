import { execSync } from "child_process";
import { Command } from "commander";
import inquirer from "inquirer";

// ============================================
// D1 ヘルパー
// ============================================

function exec(sql: string): any[] {
  const escaped = sql.replace(/"/g, '\\"');
  const result = execSync(
    `npx wrangler d1 execute inventory-db --remote --json --command="${escaped}"`,
    { encoding: "utf-8" }
  );
  return JSON.parse(result)[0]?.results ?? [];
}

function genKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sk-";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// ============================================
// CLI
// ============================================

const program = new Command();

program.name("api-keys").description("APIキー管理CLI").version("1.0.0");

// --- list ---
program
  .command("list")
  .description("APIキー一覧を表示")
  .action(() => {
    const rows = exec(
      "SELECT id, name, key, active, created_at FROM api_keys ORDER BY created_at DESC"
    );
    if (rows.length === 0) {
      console.log("\nAPIキーが登録されていません\n");
      return;
    }
    console.log("");
    console.table(
      rows.map((r: any) => ({
        ID: r.id,
        名前: r.name,
        APIキー: r.key,
        状態: r.active ? "有効" : "無効",
        作成日: r.created_at,
      }))
    );
  });

// --- create ---
program
  .command("create")
  .description("新しいAPIキーを作成")
  .action(async () => {
    const { name } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "名前（参加者名など）:",
        validate: (v: string) => (v.length > 0 ? true : "名前を入力してください"),
      },
    ]);

    const key = genKey();
    const id = `apikey-${Date.now()}`;
    const now = new Date().toISOString();

    exec(
      `INSERT INTO api_keys (id, name, key, active, created_at, updated_at) VALUES ('${id}', '${name}', '${key}', 1, '${now}', '${now}')`
    );

    console.log(`\n✅ APIキーを作成しました`);
    console.log(`  名前: ${name}`);
    console.log(`  キー: ${key}\n`);
  });

// --- deactivate ---
program
  .command("deactivate")
  .description("APIキーを無効化")
  .action(async () => {
    const rows = exec(
      "SELECT id, name, key FROM api_keys WHERE active = 1 ORDER BY created_at DESC"
    );
    if (rows.length === 0) {
      console.log("\n有効なAPIキーがありません\n");
      return;
    }

    const { id } = await inquirer.prompt([
      {
        type: "list",
        name: "id",
        message: "無効化するキーを選択:",
        choices: rows.map((r: any) => ({
          name: `${r.name} (${r.key})`,
          value: r.id,
        })),
      },
    ]);

    const { confirm } = await inquirer.prompt([
      { type: "confirm", name: "confirm", message: "本当に無効化しますか？", default: false },
    ]);

    if (!confirm) {
      console.log("キャンセルしました");
      return;
    }

    exec(
      `UPDATE api_keys SET active = 0, updated_at = '${new Date().toISOString()}' WHERE id = '${id}'`
    );
    console.log(`\n✅ ${id} を無効化しました\n`);
  });

// --- activate ---
program
  .command("activate")
  .description("APIキーを有効化")
  .action(async () => {
    const rows = exec(
      "SELECT id, name, key FROM api_keys WHERE active = 0 ORDER BY created_at DESC"
    );
    if (rows.length === 0) {
      console.log("\n無効なAPIキーがありません\n");
      return;
    }

    const { id } = await inquirer.prompt([
      {
        type: "list",
        name: "id",
        message: "有効化するキーを選択:",
        choices: rows.map((r: any) => ({
          name: `${r.name} (${r.key})`,
          value: r.id,
        })),
      },
    ]);

    exec(
      `UPDATE api_keys SET active = 1, updated_at = '${new Date().toISOString()}' WHERE id = '${id}'`
    );
    console.log(`\n✅ ${id} を有効化しました\n`);
  });

// --- delete ---
program
  .command("delete")
  .description("APIキーを削除")
  .action(async () => {
    const rows = exec(
      "SELECT id, name, key, active FROM api_keys ORDER BY created_at DESC"
    );
    if (rows.length === 0) {
      console.log("\nAPIキーがありません\n");
      return;
    }

    const { id } = await inquirer.prompt([
      {
        type: "list",
        name: "id",
        message: "削除するキーを選択:",
        choices: rows.map((r: any) => ({
          name: `${r.name} (${r.key}) [${r.active ? "有効" : "無効"}]`,
          value: r.id,
        })),
      },
    ]);

    const { confirm } = await inquirer.prompt([
      { type: "confirm", name: "confirm", message: "本当に削除しますか？（元に戻せません）", default: false },
    ]);

    if (!confirm) {
      console.log("キャンセルしました");
      return;
    }

    exec(`DELETE FROM api_keys WHERE id = '${id}'`);
    console.log(`\n✅ ${id} を削除しました\n`);
  });

program.parse();
