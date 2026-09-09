import { runQuery } from "../../../dist/application/query.js";

const root = process.env.FFVS_EXP_ROOT
  ? `${process.env.FFVS_EXP_ROOT}/ffvs-self`
  : "C:/Users/HP/AppData/Local/Temp/ffvs-exp-dsl-0006/ffvs-self";

function moduleIdOf(entity) {
  if (entity.kind === "MODULE") return entity.id;
  if (typeof entity.properties?.path === "string") return `module:${entity.properties.path}`;
  const m = /^function:([^:]+):/.exec(entity.id) || /^method:([^:]+):/.exec(entity.id);
  return m ? `module:${m[1]}` : null;
}

const callers = (
  await runQuery(root, 'search "printJson" kind function traverse callers resolution resolved')
).result.entities;
const impact = (await runQuery(root, 'search "types.ts" kind module impact')).result.entities;
const impactIds = new Set(impact.map((e) => e.id));
const callerMods = [...new Set(callers.map(moduleIdOf).filter(Boolean))];
const inter = callerMods.filter((id) => impactIds.has(id));
console.log(
  JSON.stringify(
    {
      callers: callers.length,
      impactModules: impact.length,
      callerModules: callerMods,
      intersection: inter,
      inCone: inter.length,
    },
    null,
    2,
  ),
);
