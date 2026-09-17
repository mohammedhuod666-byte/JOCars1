import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import prisma from './prisma';
import { sendWhatsAppToAdmins, isWhatsAppConfigured } from './whatsapp';

export const BACKUPS_DIR = path.join(process.cwd(), 'backups');
export const BACKUP_RECIPIENT = process.env.BACKUP_EMAIL_TO || 'mohammedhuod666@gmail.com';
const MAX_AUTO_KEEP = 10;
const EMAIL_ATTACH_LIMIT = 20 * 1024 * 1024; // 20MB — Gmail refuses bigger

const BACKUP_MODELS = [
  'user', 'car', 'carImage', 'favorite', 'message', 'conversation', 'report',
  'notification', 'subscription', 'savedSearch', 'carView', 'priceAlert', 'userRating',
  'usedPart', 'forumCategory', 'forumTopic', 'forumPost', 'auction', 'bid',
  'premiumRequest', 'auditLog', 'ticket', 'ticketMessage', 'plate', 'article',
  'wantedAd', 'wantedOffer', 'carComment', 'maintenanceService', 'carReminder',
  'userGarage', 'carExpense', 'carSoundRecording', 'soundReport', 'soundBan',
  'brand', 'model', 'city', 'province', 'workshop', 'traderVerification', 'follow',
];

const SENSITIVE_FIELDS = ['password', 'lastLoginIp', 'failedLoginAttempts', 'lockedUntil'];

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER || process.env.EMAIL_USER) &&
    Boolean(process.env.SMTP_PASS || process.env.EMAIL_PASS);
}

function smtpConfig() {
  return {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
    },
  };
}

export function formatBackupTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('ar-JO', {
    timeZone: 'Asia/Amman',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface BackupSummary {
  name: string;
  size: number;
  sizeFormatted: string;
  tables: number;
  rows: number;
  emailSent: boolean;
  emailError: string | null;
  whatsappSent: boolean;
  createdAt: string;
}

/**
 * Full Postgres JSON backup: dumps all business tables (passwords stripped),
 * saves the file, records it in the DB, emails it, and WhatsApps the admins.
 * Never throws — failures are captured in the Backup row.
 */
export async function runBackup(opts: { type: 'AUTO' | 'MANUAL'; createdBy?: string }): Promise<BackupSummary> {
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  const name = `${opts.type === 'AUTO' ? 'auto' : 'manual'}-backup-${ts}.json`;
  const filePath = path.join(BACKUPS_DIR, name);

  let payload = '';
  let tables = 0;
  let rows = 0;

  try {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

    const dump: Record<string, unknown> = {
      version: '2.0',
      source: 'JO Cars Postgres',
      createdAt: now.toISOString(),
      tables: {},
    };

    for (const modelName of BACKUP_MODELS) {
      try {
        const model = (prisma as any)[modelName];
        if (model && typeof model.findMany === 'function') {
          const records = await model.findMany();
          if (records.length > 0) {
            (dump.tables as Record<string, unknown>)[modelName] = records.map((r: Record<string, unknown>) => {
              const clean: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(r)) {
                if (!SENSITIVE_FIELDS.includes(k)) clean[k] = v;
              }
              return clean;
            });
            tables++;
            rows += records.length;
          }
        }
      } catch { /* model missing — skip */ }
    }

    payload = JSON.stringify(dump);
    fs.writeFileSync(filePath, payload);
    const size = fs.statSync(filePath).size;

    // ── Email the file ──
    let emailSent = false;
    let emailError: string | null = null;
    if (isEmailConfigured()) {
      try {
        const cfg = smtpConfig();
        const transporter = nodemailer.createTransport(cfg);
        const attach = size <= EMAIL_ATTACH_LIMIT;
        await transporter.sendMail({
          from: `"JO Cars Backup" <${cfg.auth.user}>`,
          to: BACKUP_RECIPIENT,
          subject: `📦 نسخة احتياطية (${opts.type === 'AUTO' ? 'تلقائية' : 'يدوية'}) - ${name}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#059669,#0d9488);padding:20px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:24px">JO Cars</h1>
              <p style="color:rgba(255,255,255,0.85);margin:5px 0 0">نسخة احتياطية ${opts.type === 'AUTO' ? 'تلقائية (كل 5 ساعات)' : 'يدوية'}</p>
            </div>
            <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f9fafb">
              <p style="font-size:16px;color:#374151">تم إنشاء نسخة احتياطية لقاعدة البيانات بنجاح ✅</p>
              <table style="width:100%;border-collapse:collapse;margin:15px 0">
                <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">اسم الملف</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold" dir="ltr">${name}</td></tr>
                <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">الحجم</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold">${formatSize(size)}</td></tr>
                <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">الجداول / السجلات</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:bold">${tables} / ${rows.toLocaleString('ar-EG')}</td></tr>
                <tr><td style="padding:10px;color:#6b7280;font-size:14px">الوقت (عمّان)</td><td style="padding:10px;color:#111827;font-size:14px;font-weight:bold">${formatBackupTime(now)}</td></tr>
              </table>
              ${attach ? '<p style="font-size:14px;color:#374151">📎 ملف النسخة مرفق مع هذه الرسالة</p>' : '<p style="font-size:14px;color:#b45309">⚠️ حجم الملف يتجاوز حد المرفقات — النسخة محفوظة على السيرفر ويمكن تنزيلها من لوحة الإدارة</p>'}
            </div></div>`,
          attachments: attach ? [{ filename: name, path: filePath }] : [],
        });
        emailSent = true;
      } catch (err: any) {
        emailError = err?.message || 'فشل الإرسال';
      }
    } else {
      emailError = 'البريد غير معدّ (SMTP_USER/SMTP_PASS)';
    }

    // ── Retention: keep last 10 AUTO snapshots ──
    if (opts.type === 'AUTO') {
      try {
        const old = await prisma.backup.findMany({
          where: { type: 'AUTO' },
          orderBy: { createdAt: 'desc' },
          skip: MAX_AUTO_KEEP - 1,
          select: { id: true, name: true },
        });
        for (const b of old) {
          try { fs.unlinkSync(path.join(BACKUPS_DIR, b.name)); } catch {}
          await prisma.backup.delete({ where: { id: b.id } }).catch(() => {});
        }
      } catch {}
    }

    const summary: BackupSummary = {
      name, size, sizeFormatted: formatSize(size), tables, rows,
      emailSent, emailError, whatsappSent: false, createdAt: now.toISOString(),
    };

    await prisma.backup.create({
      data: {
        name, type: opts.type, status: 'COMPLETED', size, tables, rows,
        emailSent, emailError, whatsappSent: false, createdBy: opts.createdBy,
      },
    }).catch(() => {});

    // ── WhatsApp to admins with exact timestamp ──
    try {
      if (isWhatsAppConfigured()) {
        await sendWhatsAppToAdmins(
          `📦 *JO Cars — نسخة احتياطية (${opts.type === 'AUTO' ? 'تلقائية' : 'يدوية'})*\n\n` +
          `✅ تم إنشاء النسخة وإرسالها إلى البريد\n` +
          `📁 الملف: ${name}\n` +
          `💾 الحجم: ${formatSize(size)} — ${tables} جدول / ${rows.toLocaleString('ar-EG')} سجل\n` +
          `🕐 الساعة: ${formatBackupTime(now)}\n` +
          `📧 الإيميل: ${emailSent ? 'تم الإرسال ✅' : 'تعذّر (' + (emailError || 'غير معدّ') + ')'}`
        );
        summary.whatsappSent = true;
        await prisma.backup.updateMany({ where: { name }, data: { whatsappSent: true } }).catch(() => {});
      }
    } catch { /* notify best-effort */ }

    return summary;
  } catch (err: any) {
    const message = err?.message || 'فشل غير معروف';
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    await prisma.backup.create({
      data: { name, type: opts.type, status: 'FAILED', error: message, createdBy: opts.createdBy },
    }).catch(() => {});
    return {
      name, size: 0, sizeFormatted: '0 B', tables, rows,
      emailSent: false, emailError: message, whatsappSent: false, createdAt: now.toISOString(),
    };
  }
}
