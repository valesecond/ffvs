# Security Policy

## Supported versions

FFVS is in early development (Phase 0). Security fixes are applied on the default branch as needed.

## Reporting a vulnerability

Please **do not** open a public issue for security-sensitive reports.

Prefer:

1. GitHub Security Advisories / private vulnerability reporting on the repository (when enabled), or
2. Contacting the maintainers privately through the channel published on the GitHub profile/repository.

Include:

- Description of the issue;
- Steps to reproduce;
- Impact assessment if known;
- Whether a fix is suggested.

We will acknowledge receipt when possible and work on a fix before any coordinated disclosure.

## Scope notes

FFVS runs locally and reads project files to build an index. Treat untrusted repositories like any other local tooling: review what you index. The tool should not exfiltrate data to remote services as part of its core local workflow.
