# Security Policy

## Supported versions

| Version | Supported                     |
| ------- | ----------------------------- |
| 1.0.x   | Yes                           |
| < 1.0   | Best-effort on default branch |

## Reporting a vulnerability

Please **do not** open a public issue for security-sensitive reports.

Prefer GitHub private vulnerability reporting (when enabled) or contact maintainers privately via the repository’s published channel.

Include: description, reproduction, impact, and any suggested fix.

## Privacy & local operation

FFVS **1.0** analyzes projects **locally**. Core workflows do not upload source to remote services and do not enable mandatory telemetry.

Treat untrusted repositories like any local tooling: only index code you trust to execute tooling against.

## Scope

Index/graph files under `.ffvs/` may contain structural metadata derived from your tree. Keep `.ffvs/` out of public commits when appropriate (see `docs/storage.md`).
