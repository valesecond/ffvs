import { findById } from "./repository.js";
import { formatName } from "./utils.js";

export async function loadUser(id: string) {
  const row = await findById(id);
  if (!row) {
    return null;
  }
  return { id: row.id, name: formatName(row.name) };
}
