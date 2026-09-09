import { loadUser } from "./service.js";

export async function run(userId: string) {
  const user = await loadUser(userId);
  if (!user) {
    console.log("not found");
    return;
  }
  console.log(`hello ${user.name}`);
}

await run(process.argv[2] ?? "1");
