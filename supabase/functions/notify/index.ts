import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP = Deno.env.get("APP_URL") ?? "http://localhost:5173";
const FROM = Deno.env.get("EMAIL_FROM")!;
const REPLY_TO = Deno.env.get("REPLY_TO");

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const layout = (body: string) => `<div style="max-width:480px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
  <div style="padding:24px 32px;background:#3B82F6;">
    <div style="color:#ffffff;font-size:20px;font-weight:700;">Nexlynk</div>
    <div style="color:#ffffff;font-size:11px;letter-spacing:1px;font-weight:600;">INTERNSHIP PLATFORM</div>
  </div>
  <div style="padding:32px;color:#475569;font-size:14px;line-height:1.6;">${body}</div>
  <div style="padding:20px 32px;background:#F8FAFC;color:#64748B;font-size:11px;">Nexlynk Engineers Limited, Kenya<br>This is an automated message.</div>
</div>`;

const h = (t: string) => `<div style="color:#0F172A;font-size:22px;font-weight:700;margin-bottom:12px;">${t}</div>`;
const box = (rows: [string, string][]) =>
  `<div style="background:#EFF6FF;border:1px solid #3B82F6;border-radius:8px;padding:16px 20px;margin:16px 0;">${rows
    .map(([k, v]) => `<div style="margin:4px 0;"><strong style="color:#0F172A;">${k}:</strong> ${esc(v)}</div>`)
    .join("")}</div>`;
const btn = (label: string, path: string) =>
  `<a href="${APP}${path}" style="display:inline-block;margin:8px 0;background:#3B82F6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">${label}</a>`;

const STATUS: Record<string, [string, string]> = {
  under_review: ["Under review", "The company is reviewing your application."],
  shortlisted: ["Shortlisted", "Congratulations, you have been shortlisted. The company may contact you about next steps."],
  placed: ["Placed", "Congratulations, you have been placed. Watch your inbox for instructions from the company."],
  rejected: ["Not successful", "Unfortunately your application was not successful this time. Keep applying, new roles are posted regularly."],
  pending: ["Pending", "Your application is waiting for review."],
};

async function send(to: string | undefined, subject: string, html: string) {
  if (!to) return;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html, ...(REPLY_TO ? { reply_to: REPLY_TO } : {}) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

async function application(id: string) {
  const { data, error } = await sb.from("applications")
    .select("status, student:student_profiles(name, users(email)), opportunity:opportunities(title, company_profiles(name, contact_email, users(email)))")
    .eq("id", id).single();
  if (error) throw error;
  const a: any = data;
  const co = a.opportunity?.company_profiles;
  return { a, student: a.student, studentEmail: a.student?.users?.email, opp: a.opportunity?.title, co: co?.name, coEmail: co?.contact_email ?? co?.users?.email };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-notify-secret") !== Deno.env.get("NOTIFY_SECRET")) return new Response("forbidden", { status: 403 });
  try {
    const { type, id } = await req.json();

    if (type === "application_created") {
      const x = await application(id);
      await send(x.studentEmail, `Application received: ${x.opp}`, layout(`${h("Application received")}
        <p>Hi ${esc(x.student?.name)}, your application has been submitted.</p>
        ${box([["Role", x.opp], ["Company", x.co], ["Status", "Pending review"]])}
        <p>You will get an email when the status changes.</p>${btn("View my applications", "/student/applications")}`));
      await send(x.coEmail, `New application for ${x.opp}`, layout(`${h("New application")}
        <p>Hi ${esc(x.co)}, a student applied to one of your opportunities.</p>
        ${box([["Applicant", x.student?.name], ["Role", x.opp]])}${btn("Review applicants", "/company/applicants")}`));
    } else if (type === "application_status") {
      const x = await application(id);
      const [label, msg] = STATUS[x.a.status] ?? STATUS.pending;
      await send(x.studentEmail, `Application update: ${x.opp}`, layout(`${h("Application update")}
        <p>Hi ${esc(x.student?.name)}, there is an update on your application.</p>
        ${box([["Role", x.opp], ["Company", x.co], ["New status", label]])}<p>${msg}</p>${btn("View my applications", "/student/applications")}`));
    } else if (type === "company_registered" || type === "company_status") {
      const { data, error } = await sb.from("company_profiles").select("name, status, contact_email, users(email)").eq("id", id).single();
      if (error) throw error;
      const c: any = data;
      const to = c.contact_email ?? c.users?.email;
      if (type === "company_registered") {
        await send(to, "Registration received", layout(`${h("Registration received")}
          <p>Hi ${esc(c.name)}, thank you for registering on Nexlynk. Your account is pending admin approval, which usually takes up to 24 hours.</p>
          <p>You can complete your company profile while you wait. We will email you once a decision is made.</p>${btn("Open my dashboard", "/company")}`));
      } else if (c.status === "approved") {
        await send(to, "Your Nexlynk company account is approved", layout(`${h("You are approved")}
          <p>Hi ${esc(c.name)}, your company account has been approved. You can now post opportunities, review applicants and manage placements.</p>${btn("Go to my dashboard", "/company")}`));
      } else if (c.status === "rejected") {
        await send(to, "Update on your Nexlynk registration", layout(`${h("Registration update")}
          <p>Hi ${esc(c.name)}, after review we could not approve your company account at this time.</p>
          <p>If you think this is a mistake, reply to this email or contact the Nexlynk team.</p>`));
      }
    }
    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response(String((e as Error).message ?? e), { status: 500 });
  }
});
