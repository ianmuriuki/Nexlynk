// src/jobs/emailWorker.js
// Run this as a separate process: node src/jobs/emailWorker.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'noreply@platform.com';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// ── Email templates ───────────────────────────────────────

function templates(jobName, data) {
  switch (jobName) {
    case 'sendVerificationEmail':
      return {
        to: data.email,
        subject: 'Verify your email address',
        html: `<p>Hi ${data.name},</p>
               <p>Welcome! Please click below to verify your email address.</p>
               <p><a href="${process.env.FRONTEND_URL}/verify?token=${data.token}">Verify Email</a></p>`,
      };

    case 'sendPasswordResetEmail':
      return {
        to: data.email,
        subject: 'Reset your password',
        html: `<p>Hi,</p>
               <p>Click below to reset your password. This link expires in 1 hour.</p>
               <p><a href="${process.env.FRONTEND_URL}/reset-password?token=${data.token}">Reset Password</a></p>`,
      };

    case 'sendCompanyApprovedEmail':
      return {
        to: data.email,
        subject: 'Your company account has been approved',
        html: `<p>Hi ${data.companyName},</p>
               <p>Great news! Your company account has been approved. You can now post internship opportunities.</p>
               <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>`,
      };

    case 'sendApplicationStatusEmail':
      return {
        to: data.email,
        subject: `Your application status has been updated`,
        html: `<p>Hi ${data.studentName},</p>
               <p>Your application status has been updated to: <strong>${data.newStatus}</strong>.</p>
               <p><a href="${process.env.FRONTEND_URL}/applications/${data.applicationId}">View Application</a></p>`,
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
    connection,
    concurrency: 5,
  }
);

emailWorker.on('completed', job => {
  logger.info({ event: 'email_job_completed', jobId: job.id, jobName: job.name });
});

emailWorker.on('failed', (job, err) => {
  logger.error({ event: 'email_job_failed', jobId: job?.id, jobName: job?.name, error: err.message });
});

logger.info('Email worker started');