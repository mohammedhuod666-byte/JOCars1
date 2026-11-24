---
trigger: always_on
---

# Automatic GitHub Backup & Safe Team Sync Rule

After completing any code edit, feature implementation, or bug fix in this workspace, you MUST run the safe sync & backup script so that collaborator updates are pulled first (`git pull --rebase`) and all local changes are backed up to `https://github.com/mohammedhuod666-byte/JOCars1`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/auto-backup.ps1 -Message "chore: <brief summary of edit>"
```

Rules:
- ALWAYS pull remote updates (`origin/main`) before pushing so collaborator commits from `saifdaradkah09@gmail.com` are never overwritten.
- NEVER stage or commit `.env`, `.env.local`, database files, or secrets (keep them in `.gitignore`).
- If a rebase conflict ever occurs, resolve it carefully preserving both parties' logic and re-run `npm run test:valuation` before pushing.
