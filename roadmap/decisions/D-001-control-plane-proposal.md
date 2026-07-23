---
id: D-008
type: decision
title: Adopt the upgraded control-plane bundle (W0F migration)
status: accepted
approved_by: klunt (2026-07-22, IDEA-003 promotion + owner go directive)
date: 2026-07-22
supersedes: []
updated: 2026-07-22
---

# D-008 — Adopt the upgraded control-plane bundle

This file occupies the installer's create-only seed slot as an adopted record. The real
decision: migrate this repository IN FULL to the upgraded control-plane bundle —
receipts, snapshot-coherent validation, claim fencing, writer_mode: serial — per the
reconciliation inventory in [[IDEA-003]] and executed as W0F. Prior local hardening
(audits #1–#2) is preserved where the bundle has no equivalent (identity allowlist,
pre-push selftest gate).
