# EXP-DSL-0004 — additional PATH / IMPACT questions

| ID  | Question                                  | DSL                                                              | Result  | Notes                                                           |
| --- | ----------------------------------------- | ---------------------------------------------------------------- | ------- | --------------------------------------------------------------- |
| N01 | Path Controller → Database?               | `path "Controller.js" "Database.js"`                             | PASS    | layered                                                         |
| N02 | Path after select filter?                 | `select modules where name = "Controller.js" path "Database.js"` | PASS    |                                                                 |
| N03 | Reverse path Database → Controller?       | `path "Database.js" "Controller.js"`                             | PASS    | found=false (directed)                                          |
| N04 | Impact cone of Database?                  | `select modules where name = "Database.js" impact`               | PASS    |                                                                 |
| N05 | Impact after search?                      | `search "Database" kind module impact describe`                  | PASS    |                                                                 |
| N06 | Diamond impact unique?                    | `select modules where name = "d.js" impact`                      | PASS    | diamond fixture                                                 |
| N07 | Cycle impact terminates?                  | `select modules where name = "alpha.js" impact`                  | PASS    | cycle fixture                                                   |
| N08 | Cycle path alpha→beta?                    | `path "alpha.js" "beta.js"`                                      | PASS    |                                                                 |
| N09 | Path then describe?                       | `path "Controller.js" "Database.js" describe`                    | PASS    |                                                                 |
| N10 | Callers affected by changing X via CALLS? | —                                                                | PARTIAL | IMPACT is IMPORTS-only; use `traverse callers` for direct CALLS |

## Pattern checks

| Pattern                             | Status                                            |
| ----------------------------------- | ------------------------------------------------- |
| SEARCH → PATH                       | PASS (`search` seed then `path "T"` if singleton) |
| SELECT → FILTER → PATH              | PASS                                              |
| SELECT → FILTER → IMPACT → DESCRIBE | PASS                                              |
| SEARCH → IMPACT → DESCRIBE          | PASS                                              |
| PATH → DESCRIBE                     | PASS                                              |
| SEARCH → TRAVERSE → PATH            | PARTIAL                                           | only if traverse leaves singleton source |
