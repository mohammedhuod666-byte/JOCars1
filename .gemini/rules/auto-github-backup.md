---
trigger: always_on
---

# Automatic GitHub Backup Rule

After completing any code edit, feature implementation, or bug fix in this workspace, you MUST run the automatic GitHub backup script to commit and push all changes to `https://github.com/mohammedhuod666-byte/JOCars1`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/auto-backup.ps1 -Message "chore: auto-backup <brief summary of edit>"
```

Never skip this step after modifying workspace files. Ensure `.env` and secret files remain ignored by `.gitignore`.
