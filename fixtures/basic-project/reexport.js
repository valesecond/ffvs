import { readFileSync } from "fs";
export { UserService } from "./UserService.js";

export function loadConfig() {
  return readFileSync("./config.json", "utf8");
}
