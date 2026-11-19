# Monarch Video — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict PII Isolation (`/users/{userId}`)**: A user profile containing `email` can ONLY be read, created, updated, or deleted by the authenticated owner (`request.auth.uid == userId`). Blanket `list` queries on `/users` are strictly forbidden.
2. **Project Ownership & Immutability (`/projects/{projectId}`)**: Every `VideoProjectDoc` MUST have `ownerId == request.auth.uid`, `id == projectId`, and verified email (`request.auth.token.email_verified == true`) on writes. `ownerId`, `id`, and `createdAt` are immutable after creation.
3. **Hermes Human-Gated Promotion & Terminal Lock (`/hermesMemories/{memoryId}`)**: Every `HermesMemoryDoc` belongs strictly to `ownerId == request.auth.uid`. Once a memory reaches terminal state `status == 'archived'`, no further updates are permitted.
4. **Strict Timestamps & Zero Shadow Fields**: All `createdAt` and `updatedAt` fields MUST equal `request.time`. All documents enforce `keys().hasAll(...) && keys().hasOnly(...)` on create and action-scoped `affectedKeys().hasOnly(...)` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-Tenant Project Spoof**: Create `/projects/proj-evil` with `ownerId: "victim-uid"` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Project Create**: Create `/projects/proj-1` with extra key `isAdmin: true` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: Write `/projects/proj-1` with `email_verified: false` -> `PERMISSION_DENIED`.
4. **Path ID Poisoning**: Create `/projects/../../etc/passwd` or 200-char ID -> `PERMISSION_DENIED`.
5. **Owner Transfer on Update**: Update `/projects/proj-1` changing `ownerId` -> `PERMISSION_DENIED`.
6. **Backdated Timestamp Spoof**: Create `/projects/proj-1` with client timestamp != `request.time` -> `PERMISSION_DENIED`.
7. **PII Leak Attempt**: `get(/users/victim-uid)` as attacker -> `PERMISSION_DENIED`.
8. **User Directory Enumeration**: `list(/users)` as authenticated user -> `PERMISSION_DENIED`.
9. **Unfiltered Project Scrape**: `list(/projects)` without `where("ownerId", "==", auth.uid)` -> `PERMISSION_DENIED`.
10. **Denial-of-Wallet Oversized Prompt**: Create `/projects/proj-1` with 20KB `prompt` string -> `PERMISSION_DENIED`.
11. **Terminal State Violation**: Update `/hermesMemories/mem-1` after `status == 'archived'` -> `PERMISSION_DENIED`.
12. **Array Bound Overflow**: Create `/hermesMemories/mem-1` with 25 items in `tags` (>10 max) -> `PERMISSION_DENIED`.
