// src/jobs/emailWorker.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const nodemailer  = require('nodemailer');
const logger      = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM     = process.env.EMAIL_FROM    || 'noreply@nexlynk.dev';
const BASE_URL = process.env.FRONTEND_URL  || 'http://localhost:5173';

// ── Shared styles ─────────────────────────────────────────
const css = `
  body { margin:0; padding:0; background:#f8fafc; font-family:'Segoe UI',Arial,sans-serif; }
  .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:16px;
          border:1px solid #e2e8f0; overflow:hidden; }
  .header { background:#0B1D3F; padding:28px 32px; }
  .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-0.3px; }
  .header span { color:#60a5fa; }
  .body { padding:32px; }
  .body p { margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6; }
  .btn { display:inline-block; margin:8px 0 20px;
         background:#1A56DB; color:#fff !important; text-decoration:none;
         padding:12px 28px; border-radius:10px; font-weight:600; font-size:15px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px;
           font-size:13px; font-weight:600; }
  .badge-success { background:#d1fae5; color:#065f46; }
  .badge-warning { background:#fef3c7; color:#92400e; }
  .badge-info    { background:#dbeafe; color:#1e40af; }
  .badge-danger  { background:#fee2e2; color:#991b1b; }
  .info-box { background:#f1f5f9; border-radius:10px; padding:16px 20px; margin:16px 0; }
  .info-box p { margin:4px 0; font-size:14px; color:#475569; }
  .footer { background:#f8fafc; border-top:1px solid #e2e8f0;
            padding:20px 32px; text-align:center; }
  .footer p { margin:0; font-size:12px; color:#94a3b8; }
`;

function layout(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${css}</style></head><body>
    <div class="wrap">
      <div class="header"><h1>Nex<span>lynk</span></h1></div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© 2026 Nexlynk Engineers Limited · Kenya</p>
        <p style="margin-top:4px">This is an automated message, please do not reply.</p>
      </div>
    </div></body></html>`;
}

// ── Templates ─────────────────────────────────────────────
function templates(jobName, data) {
  switch (jobName) {

    // 1. Student / user email verification
    case 'sendVerificationEmail':
      return {
        to: data.email,
        subject: 'Verify your Nexlynk email address',
        html: layout(`
          <p>Hi <strong>${data.name || 'there'}</strong>,</p>
          <p>Welcome to Nexlynk! You're one step away from accessing Kenya's top internship marketplace.</p>
          <p>Click the button below to verify your email address:</p>
          <a href="${BASE_URL}/verify?token=${data.token}" class="btn">Verify my email →</a>
          <div class="info-box">
            <p>⏰ This link expires in <strong>24 hours</strong>.</p>
            <p>If you didn't create a Nexlynk account, you can safely ignore this email.</p>
          </div>
        `),
      };

    // 2. Application received — to student
    case 'sendApplicationReceivedEmail':
      return {
        to: data.studentEmail,
        subject: `Application received — ${data.opportunityTitle}`,
        html: layout(`
          <p>Hi <strong>${data.studentName || 'there'}</strong>,</p>
          <p>Your application has been successfully submitted. Here are the details:</p>
          <div class="info-box">
            <p><strong>Role:</strong> ${data.opportunityTitle}</p>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Status:</strong> <span class="badge badge-warning">Pending Review</span></p>
          </div>
          <p>The company will review your application and you'll receive an update by email. You can track all your applications on your dashboard.</p>
          <a href="${BASE_URL}/student/applications" class="btn">View my applications →</a>
        `),
      };

    // 3. New application alert — to company
    case 'sendNewApplicationAlertEmail':
      return {
        to: data.companyEmail,
        subject: `New application for "${data.opportunityTitle}"`,
        html: layout(`
          <p>Hi <strong>${data.companyName}</strong>,</p>
          <p>A new application has been received for one of your opportunities:</p>
          <div class="info-box">
            <p><strong>Applicant:</strong> ${data.studentName}</p>
            <p><strong>Role:</strong> ${data.opportunityTitle}</p>
            <p><strong>University:</strong> ${data.studentUniversity || 'Not specified'}</p>
            <p><strong>Discipline:</strong> ${data.studentDiscipline || 'Not specified'}</p>
          </div>
          <p>Log in to your dashboard to review the application and shortlist or reject.</p>
          <a href="${BASE_URL}/company/applicants" class="btn">Review applicants →</a>
        `),
      };

    // 4. Application status update — to student
    case 'sendApplicationStatusEmail': {
      const statusMap = {
        shortlisted: { label: 'Shortlisted 🎉', cls: 'badge-info',    msg: 'Congratulations! You have been shortlisted. The company may contact you for next steps.' },
        placed:      { label: 'Placed ✅',       cls: 'badge-success', msg: 'Congratulations! You have been placed. Check your email for further instructions from the company.' },
        rejected:    { label: 'Not Successful',  cls: 'badge-danger',  msg: 'Unfortunately your application was not successful this time. Keep applying — new opportunities are posted regularly.' },
        pending:     { label: 'Under Review',    cls: 'badge-warning', msg: 'Your application is currently under review.' },
      };
      const s = statusMap[data.newStatus] || statusMap.pending;
      return {
        to: data.email,
        subject: `Application update — ${data.opportunityTitle || 'your application'}`,
        html: layout(`
          <p>Hi <strong>${data.studentName || 'there'}</strong>,</p>
          <p>There's an update on your application:</p>
          <div class="info-box">
            <p><strong>Role:</strong> ${data.opportunityTitle || 'Opportunity'}</p>
            <p><strong>Company:</strong> ${data.companyName || ''}</p>
            <p><strong>New status:</strong> <span class="badge ${s.cls}">${s.label}</span></p>
          </div>
          <p>${s.msg}</p>
          <a href="${BASE_URL}/student/applications" class="btn">View my applications →</a>
        `),
      };
    }

    // 5. Company registration — pending approval
    case 'sendCompanyRegisteredEmail':
      return {
        to: data.email,
        subject: 'Company registration received — pending approval',
        html: layout(`
          <p>Hi <strong>${data.companyName}</strong>,</p>
          <p>Thank you for registering on Nexlynk! Your company account has been created and is currently <span class="badge badge-warning">Pending Approval</span>.</p>
          <div class="info-box">
            <p>Our team will review your account within <strong>24 hours</strong>.</p>
            <p>Once approved, you'll be able to post opportunities and browse student profiles.</p>
          </div>
          <p>You'll receive another email as soon as your account is approved.</p>
          <p>If you have any questions, contact us at <a href="mailto:support@nexlynk.dev">support@nexlynk.dev</a>.</p>
        `),
      };

    // 6. Company approved
    case 'sendCompanyApprovedEmail':
      return {
        to: data.email,
        subject: 'Your Nexlynk company account is now active ✅',
        html: layout(`
          <p>Hi <strong>${data.companyName}</strong>,</p>
          <p>Great news! Your company account has been reviewed and <span class="badge badge-success">Approved</span>.</p>
          <p>You can now:</p>
          <ul style="color:#334155;font-size:15px;line-height:2;padding-left:20px;">
            <li>Post internship and attachment opportunities</li>
            <li>Browse verified student profiles</li>
            <li>Manage applications and placements</li>
          </ul>
          <a href="${BASE_URL}/company" class="btn">Go to my dashboard →</a>
        `),
      };

    // 7. Company rejected
    case 'sendCompanyRejectedEmail':
      return {
        to: data.email,
        subject: 'Update on your Nexlynk company registration',
        html: layout(`
          <p>Hi <strong>${data.companyName}</strong>,</p>
          <p>After reviewing your registration, we were unable to approve your account at this time.</p>
          <div class="info-box">
            <p>If you believe this is a mistake or would like to reapply with updated information, please contact us at <a href="mailto:support@nexlynk.dev">support@nexlynk.dev</a>.</p>
          </div>
        `),
      };

    // 8. Password reset
    case 'sendPasswordResetEmail':
      return {
        to: data.email,
        subject: 'Reset your Nexlynk password',
        html: layout(`
          <p>Hi,</p>
          <p>We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <a href="${BASE_URL}/reset-password?token=${data.token}" class="btn">Reset my password →</a>
          <div class="info-box">
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
          </div>
        `),
      };

    default:
      return null;
  }
}

// ── Worker ────────────────────────────────────────────────
const emailWorker = new Worker(
  'emails',
  async (job) => {
    const mail = templates(job.name, job.data);
    if (!mail) {
      logger.warn({ event: 'unknown_email_job', jobName: job.name });
      return;
    }
    await transporter.sendMail({ from: FROM, ...mail });
    logger.info({ event: 'email_sent', jobName: job.name, to: mail.to });
  },
  {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    concurrency: 5,
  }
);

emailWorker.on('completed', job =>
  logger.info({ event: 'email_job_completed', jobId: job.id, jobName: job.name })
);
emailWorker.on('failed', (job, err) =>
  logger.error({ event: 'email_job_failed', jobId: job?.id, jobName: job?.name, error: err.message })
);

logger.info('Email worker started');