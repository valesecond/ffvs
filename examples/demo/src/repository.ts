const users = new Map([
  ["1", { id: "1", name: " Ada " }],
  ["2", { id: "2", name: " Alan " }],
]);

export async function findById(id: string) {
  return users.get(id) ?? null;
}
