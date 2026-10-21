import { Link } from 'react-router-dom'
import NexlynkLogo from '@/components/shared/NexlynkLogo'

const DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    intro: 'These draft terms describe the current Nexlynk internship platform. They require review and approval before being treated as final legal terms.',
    sections: [
      {
        id: 'accounts',
        title: 'Accounts',
        paragraphs: [
          'Nexlynk currently uses email verification codes for account access. Keep your email address current and provide accurate information for your account.',
          'Company accounts require administrator approval before they can publish opportunities.',
        ],
      },
      {
        id: 'platform',
        title: 'Using the platform',
        paragraphs: [
          'Students can create profiles, browse published opportunities, submit applications, and track application status.',
          'Companies can maintain a company profile, publish opportunities after approval, and review applications submitted to their opportunities.',
          'Do not submit content you do not have permission to share, or use the platform to mislead, harass, or interfere with other users.',
        ],
      },
      {
        id: 'applications',
        title: 'Applications and placements',
        paragraphs: [
          'Submitting an application does not guarantee an interview, offer, internship, or placement. Companies make their own selection decisions.',
          'When you apply, the company receiving the application can review the application details and any CV attached to it.',
        ],
      },
      {
        id: 'availability',
        title: 'Availability and changes',
        paragraphs: [
          'The platform and its opportunities may change over time. Final service availability, account suspension, and dispute terms have not yet been supplied for this draft.',
        ],
      },
      {
        id: 'review',
        title: 'Before publication',
        paragraphs: [
          'This is draft website copy, not a substitute for legal advice. Confirm the contracting entity, governing law, liability terms, dispute process, and effective date with a qualified legal reviewer before publication.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This draft explains the information the current Nexlynk app handles. It requires review and completion before being treated as the final privacy policy.',
    sections: [
      {
        id: 'information',
        title: 'Information in the app',
        paragraphs: [
          'Account information includes your name, email address, and role. Student profiles can include contact details, education, skills, availability, biography, and CV. Company profiles can include company details, contact information, and a logo.',
          'The app also stores opportunities, applications, application status, and related timestamps. The opportunity view feature may record that an opportunity was viewed.',
        ],
      },
      {
        id: 'use',
        title: 'How information is used',
        paragraphs: [
          'The app uses account information to provide email-code sign-in, profiles, opportunity listings, applications, and application status updates.',
          'Company information is used to display company profiles and opportunities. Administrator access supports company approval and application management.',
        ],
      },
      {
        id: 'sharing',
        title: 'Sharing for applications',
        paragraphs: [
          'When a student applies to an opportunity, the relevant company can review the application and student information made available in the applicant workflow, including an attached CV.',
          'Supabase provides the app authentication, database, and storage services. The final policy should identify all service providers and explain any additional sharing.',
        ],
      },
      {
        id: 'storage',
        title: 'Storage and retention',
        paragraphs: [
          'Profile images and CVs are stored using Supabase Storage. CV access uses time-limited signed links.',
          'Retention periods, account deletion steps, backup handling, and the process for privacy requests have not yet been supplied. These details must be completed before publication.',
        ],
      },
      {
        id: 'contact',
        title: 'Privacy contact',
        paragraphs: [
          'A monitored privacy contact address and the applicable legal entity and jurisdiction have not yet been supplied. Add and verify them before publication.',
        ],
      },
      {
        id: 'review',
        title: 'Draft notice',
        paragraphs: [
          'This is draft website copy, not a final privacy notice or legal advice. Have it reviewed for applicable privacy laws and confirm the missing retention, rights, contact, and jurisdiction details before publication.',
        ],
      },
    ],
  },
}

export default function LegalPage({ kind = 'terms' }) {
  const document = DOCUMENTS[kind] || DOCUMENTS.terms

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="Nexlynk home" className="flex items-center gap-3">
            <NexlynkLogo variant="icon" />
            <span className="text-base font-extrabold text-ink">Nexlynk</span>
          </Link>
          <nav aria-label="Account" className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/login" className="text-ink-3 hover:text-brand">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Create account</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="mb-8 border-l-4 border-warning bg-warning-light px-4 py-3 text-sm text-warning-dark">
          Draft for review. These pages contain preliminary information and are not final legal documents.
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article className="min-w-0 rounded-2xl border border-line bg-white px-6 py-8 shadow-card md:px-10">
            <p className="mb-2 text-xs font-bold uppercase text-brand">Nexlynk</p>
            <h1 className="text-3xl font-extrabold text-ink md:text-4xl">{document.title}</h1>
            <p className="mt-4 border-b border-line pb-7 text-base leading-7 text-ink-3">{document.intro}</p>

            <div className="divide-y divide-line">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-8 py-6">
                  <h2 className="text-lg font-extrabold text-ink">{section.title}</h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-ink-2">{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card lg:sticky lg:top-6">
            <h2 className="text-sm font-extrabold text-ink">On this page</h2>
            <nav aria-label="Page sections" className="mt-3 flex flex-col gap-1">
              {document.sections.map((section) => (
                <a key={section.id} href={'#' + section.id} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-3 hover:bg-brand-soft hover:text-brand-ink">
                  {section.title}
                </a>
              ))}
            </nav>
            <div className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-4">
              <Link to="/terms" className="hover:text-brand">Terms</Link>
              {' · '}
              <Link to="/privacy" className="hover:text-brand">Privacy</Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
