import { Link } from 'react-router-dom'
import NexlynkLogo from '@/components/shared/NexlynkLogo'

const CONTACT = {
  company: 'Nexlynk Engineers Ltd',
  email: 'support@nexlynkengineers.co.ke',
  phone: '+254 716 050 987',
  location: 'P.O Box 72968, 00200, Nairobi, Kenya',
}

const CONTACT_TABLE = {
  rows: [
    ['Company', CONTACT.company],
    ['Email', CONTACT.email],
    ['Phone', CONTACT.phone],
    ['Location', CONTACT.location],
  ],
}

const DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: 20 October 2026',
    intro:
      'These Terms of Service govern your use of the Nexlynk Engineers Ltd website and platform. Nexlynk is a Kenyan company that helps engineering and other STEM students and graduates become ready for industry through training, vetting, mentorship, internships and job placement.',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of these terms',
        paragraphs: [
          'By creating an account or using the platform, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the platform or our services.',
          'In these terms, "Nexlynk", "we", "our" and "us" mean Nexlynk Engineers Ltd.',
        ],
      },
      {
        id: 'who',
        title: '2. Who can use the platform',
        paragraphs: ['The platform is used by the following groups:'],
        items: [
          'Talent: students and graduates who register, apply to cohorts, take part in training or are placed through us.',
          'Employers and companies: organisations that create a company profile, browse or hire talent, or host interns and trainees.',
          'Partners, sponsors and mentors: organisations and professionals who support training, funding and mentorship.',
        ],
        after: [
          'The platform is intended for people at a higher learning level. You must be at least 18 years old to create an account.',
        ],
      },
      {
        id: 'accounts',
        title: '3. Accounts',
        paragraphs: [
          'Nexlynk currently uses email verification codes for account access. Keep your email address current and give accurate information when you register and when you update your profile.',
          'You are responsible for activity on your account. Keep your login details private and tell us immediately if you suspect misuse.',
          'Company accounts require administrator approval before they can publish opportunities.',
        ],
      },
      {
        id: 'using',
        title: '4. Using the platform',
        paragraphs: [
          'Talent can create profiles, browse published opportunities, apply to cohorts and placements, and track the status of their applications.',
          'Companies can maintain a company profile, publish opportunities after approval, and review applications submitted to their opportunities.',
          'You agree not to:',
        ],
        items: [
          'give false or misleading information, including about your education, skills or experience;',
          'upload content you do not have permission to share;',
          'harass, mislead or interfere with other users;',
          'attempt to access accounts, data or systems that you are not authorised to use;',
          'use the platform for anything unlawful.',
        ],
      },
      {
        id: 'documents',
        title: '5. Official documents',
        paragraphs: [
          'Nexlynk does not collect official documents for redistribution. Please do not upload your national ID, passport, certificates or transcripts unless we have specifically asked for them and told you why.',
          'Any official document verification an employer needs is handled directly between you and that employer.',
        ],
      },
      {
        id: 'applications',
        title: '6. Applications and placements',
        paragraphs: [
          'Submitting an application does not guarantee an interview, offer, internship or placement. Companies make their own selection decisions, and Nexlynk does not control them.',
          'When you apply, the company receiving the application can review your application details and any CV attached to it.',
          'If you are part of our talent pool, employers with a paid company profile can view the profile information you have chosen to share, as explained in the Privacy Policy.',
        ],
      },
      {
        id: 'training',
        title: '7. Training, assessments and feedback',
        paragraphs: [
          'We run training such as onboarding, CV optimisation, presentation skills, OSHA regulations, work ethics and technical skills training. We also assess and vet talent.',
          'Assessment results and structured feedback from companies and mentors may be recorded and used to improve training and to give employers reliable information about you. You can ask to see feedback and assessment records about yourself.',
        ],
      },
      {
        id: 'employers',
        title: '8. Employers and companies',
        paragraphs: [
          'Companies must give accurate information about their organisation and opportunities, and must only publish genuine opportunities.',
          'Talent information seen through the platform may only be used for recruitment and for the purpose it was shared. Companies must not sell it, publish it or pass it to others.',
          'Some company features, such as a paid company profile, may carry fees. Any fees will be shown to you before you commit to them.',
        ],
      },
      {
        id: 'content',
        title: '9. Your content',
        paragraphs: [
          'You keep ownership of the content you submit, such as your CV, profile details, company logo and application answers. You give Nexlynk permission to store, display and share that content as needed to run the platform and as described in the Privacy Policy.',
          'We will ask for your clear permission before publishing identifiable photos, videos, testimonials or personal stories.',
        ],
      },
      {
        id: 'projects',
        title: '10. Student projects and innovation',
        paragraphs: [
          'If Nexlynk helps you develop a project into a product, or enter an innovation challenge or grant programme, we will agree with you in writing how the project, its data and any intellectual property will be handled.',
        ],
      },
      {
        id: 'third',
        title: '11. Third party links',
        paragraphs: [
          'The platform may link to employer sites, training partners and social media. We are not responsible for the content or privacy practices of those third parties.',
        ],
      },
      {
        id: 'availability',
        title: '12. Availability and changes',
        paragraphs: [
          'The platform and its opportunities may change over time, and we may update, pause or remove features. We do not promise that the platform will always be available or free of errors.',
        ],
      },
      {
        id: 'suspension',
        title: '13. Suspension and ending your account',
        paragraphs: [
          'We may suspend or close an account that breaks these terms, contains false information, or puts other users or the platform at risk.',
          'You can ask us to close your account or delete your data at any time by contacting us. What happens to your data is explained in the Privacy Policy.',
        ],
      },
      {
        id: 'liability',
        title: '14. Disclaimer and liability',
        paragraphs: [
          'Nexlynk connects talent, employers and partners. We are not the employer in any internship, job or placement, and we do not guarantee that any opportunity listed will lead to employment or that any candidate will meet an employer\'s needs.',
          'To the extent the law allows, Nexlynk is not liable for losses that come from decisions made by companies or talent, from third party content or sites, or from interruptions to the platform. Nothing in these terms limits any right you have under Kenyan law that cannot be limited.',
        ],
      },
      {
        id: 'privacy',
        title: '15. Privacy',
        paragraphs: [
          'We handle personal data in line with the Data Protection Act, 2019 of Kenya. Please read our Privacy Policy to see what we collect and how we use it.',
        ],
        link: { to: '/privacy', label: 'Read the Privacy Policy' },
      },
      {
        id: 'law',
        title: '16. Governing law',
        paragraphs: [
          'These terms are governed by the laws of Kenya. Any dispute that we cannot settle by talking to each other will be handled by the courts of Kenya.',
        ],
      },
      {
        id: 'changes',
        title: '17. Changes to these terms',
        paragraphs: [
          'We may update these terms as our services, partnerships and legal requirements change. We will post the updated terms on our website and platform and change the "Last updated" date at the top. Where a change is significant, we will take reasonable steps to notify you. If you keep using the platform after a change, you accept the updated terms.',
        ],
      },
      {
        id: 'contact',
        title: '18. Contact us',
        paragraphs: ['If you have questions about these terms, please contact us:'],
        table: CONTACT_TABLE,
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 20 October 2026',
    intro:
      'Nexlynk Engineers Ltd ("Nexlynk", "we", "our", "us") is a Kenyan company that bridges the gap between academic training and industry readiness for engineering and other STEM students and graduates. We do this through structured training and vetting, skill based technical training, mentorship, internship and job placement, and partnerships with companies, sponsors and training organisations.',
    sections: [
      {
        id: 'introduction',
        title: '1. Introduction',
        paragraphs: [
          'This Privacy Policy explains how we collect, use, share, store and protect your personal information when you visit our website or social media pages, sign up for a Nexlynk account, join our training programmes, or work with us as an employer, partner, sponsor or mentor.',
          'We process personal data in line with the Data Protection Act, 2019 of Kenya and its regulations. By using our services or giving us your information, you confirm that you have read and understood this policy. If you do not agree with it, please do not use our platform or services.',
        ],
      },
      {
        id: 'applies',
        title: '2. Who this policy applies to',
        items: [
          'Talent: students and graduates who register with Nexlynk, apply to our cohorts, take part in our training or are placed through us.',
          'Employers and companies: organisations that create a company profile, browse or hire talent, or host interns and trainees.',
          'Partners, sponsors and funders: industry training partners, sponsors, accelerators, incubators and other organisations that work with us.',
          'Mentors and alumni: placed talent, graduate engineers and professionals who mentor future cohorts.',
          'Visitors and followers: anyone who visits our website or interacts with our social media channels.',
        ],
      },
      {
        id: 'collect',
        title: '3. Information we collect',
        subsections: [
          {
            title: '3.1 Information you give us',
            paragraphs: [
              'Talent are asked to share, voluntarily, the information needed to train, vet and place them. This may include:',
            ],
            items: [
              'Identity and contact details: your name, email address, phone number and location.',
              'Education details: your institution, course, year of study or graduation year, and discipline.',
              'Professional details: your CV, skills, projects, internships, availability, biography, interests and career goals.',
              'Application information: your responses when you apply to a cohort or a placement opportunity.',
            ],
            after: [
              'Employers, partners, sponsors and mentors may give us their name, job title, organisation name, company details, logo, work email, phone number, hiring or training needs, and areas in which they wish to support talent.',
              'Our app also stores your account role, the opportunities and applications on the platform, application status, and related timestamps. The opportunity view feature may record that an opportunity was viewed.',
            ],
          },
          {
            title: '3.2 Information we create while working with you',
            items: [
              'Training data: attendance, participation and completion records for programmes such as pre placement training (CV optimisation, presentation skills, OSHA regulations, work ethics) and technical skills training (for example AutoCAD and other industry required skills).',
              'Assessment data: skill assessment results, pass or fail outcomes and performance insights used to vet talent.',
              'Mentorship and progress data: notes on progress, mentor matches and career pathway planning.',
              'Placement data: opportunities you apply for, shortlisting status, interview outcomes and whether you are placed.',
              'Feedback: structured feedback that companies and mentors give us about talent, and feedback that talent gives us about programmes and placements.',
            ],
          },
          {
            title: '3.3 Information collected automatically',
            paragraphs: [
              'When you use our website or platform we may automatically collect your IP address, browser type, operating system, device information, pages visited, and the dates and times of your visits. If you interact with our social media pages, the relevant platform may share limited engagement and audience statistics with us.',
            ],
          },
          {
            title: '3.4 Documents we do not take',
            paragraphs: [
              'Nexlynk does not collect official documents for redistribution. We do not collect, store or pass on original or certified copies of your national ID, passport, academic certificates, transcripts or similar official records for the purpose of sharing them with third parties. Any official document verification needed by an employer is handled directly between you and that employer. Please do not upload official documents to our platform unless we have specifically asked for them and told you why.',
            ],
          },
          {
            title: '3.5 Information provided freely',
            paragraphs: [
              'All personal data that talent provides to Nexlynk is provided freely and voluntarily, and you are not paid for it. Nothing in this policy obliges you to give us any information, but some services (such as training, vetting and placement) cannot be provided without certain basic details.',
            ],
          },
        ],
      },
      {
        id: 'use',
        title: '4. How we use your information',
        paragraphs: [
          'We use personal information only for the purposes described below, and only where we have your consent, a contract with you, a legitimate interest, or a legal obligation to do so.',
        ],
        items: [
          'To create and manage your account, provide email code sign in, and verify who is accessing the platform.',
          'To review applications and select participants for cohorts and training programmes.',
          'To deliver onboarding, ethics, OSHA, skills and other training, and to assess and vet talent.',
          'To maintain a vetted talent pool and match talent with internships, apprenticeships and jobs.',
          'To connect employers and partners with candidates who have already been vetted and are ready for work.',
          'To display company profiles and opportunities, and to support company approval and application management by administrators.',
          'To run mentorship programmes, including linking placed talent with future cohorts.',
          'To track progress, measure placement outcomes, and produce verified performance and skill insights.',
          'To communicate with you about opportunities, training, updates, support and administrative matters.',
          'To develop and improve our programmes, training models, platform and new features.',
          'To report on our impact in aggregated or anonymised form to partners, sponsors and funders.',
          'To promote our work, but only with your separate permission where you can be identified (see section 5.4).',
          'To comply with legal obligations and to enforce our terms.',
        ],
      },
      {
        id: 'share',
        title: '5. How we share your information',
        paragraphs: ['We do not sell your personal information. We share it only as described below.'],
        subsections: [
          {
            title: '5.1 With employers and hiring organisations',
            paragraphs: [
              'A core part of our service is connecting talent with employers. If you are part of our talent pool, employers with a paid company profile may view the profile information you have chosen to share with us, such as your name, discipline, skills, CV, training completed and assessment outcomes. Employers see only what is needed for recruitment, and we ask them to use it only for that purpose.',
              'When you apply to an opportunity, the relevant company can review your application and the student information made available in the applicant workflow, including an attached CV.',
            ],
          },
          {
            title: '5.2 With training partners, sponsors and mentors',
            paragraphs: [
              'Where a training partner delivers a programme you have joined, or a sponsor funds your training or placement, we may share the details needed to run that programme (for example your name, attendance and results). Sponsors and funders are generally given aggregated or anonymised reports. Mentors only receive the details needed to mentor you.',
            ],
          },
          {
            title: '5.3 With service providers',
            paragraphs: [
              'We use trusted third parties to help us run Nexlynk, such as cloud hosting, email and messaging tools, form and survey tools, video conferencing, and analytics providers. Supabase provides our authentication, database and file storage services. These providers may only use your information to provide services to us and are expected to protect it.',
            ],
          },
          {
            title: '5.4 Photos, testimonials and social media',
            paragraphs: [
              'We may feature training sessions, placements and success stories on our website and social media pages. We will ask for your clear permission before publishing identifiable photos, videos, testimonials or other personal stories, and you may withdraw that permission at any time.',
            ],
          },
          {
            title: '5.5 Legal and safety reasons',
            paragraphs: [
              'We may disclose information where required by law, a court order or a lawful request from a government authority, or where necessary to protect the rights, property or safety of Nexlynk, our users or others.',
            ],
          },
          {
            title: '5.6 Business changes',
            paragraphs: [
              'If Nexlynk is restructured, merged or acquired, personal data may be transferred to the successor organisation, which will be bound to protect it in line with this policy.',
            ],
          },
        ],
      },
      {
        id: 'glance',
        title: 'At a glance',
        table: {
          head: ['Who', 'What we collect', 'Why'],
          rows: [
            [
              'Talent (students and graduates)',
              'Contact details, CV, education and skills, training and assessment results, placement outcomes',
              'Training, vetting, mentorship and placement.',
            ],
            [
              'Employers and companies',
              'Company and contact person details, hiring needs, feedback on talent.',
              'Company profiles, talent matching, structured feedback.',
            ],
            [
              'Partners, sponsors and mentors',
              'Contact details, organisation details, areas of support.',
              'Partnerships, sponsorship, mentorship programmes.',
            ],
            [
              'Visitors and followers',
              'Website, device and social media interaction data.',
              'Running and improving our services and outreach.',
            ],
          ],
        },
      },
      {
        id: 'feedback',
        title: '6. Feedback and performance data',
        paragraphs: [
          'Our model relies on trust between talent and industry. Companies and mentors may give us structured feedback on talent they have worked with, and we record assessment and performance results. This information is used to improve training, support your career growth and give employers reliable insights. You may ask to see feedback and assessment records about yourself.',
        ],
      },
      {
        id: 'projects',
        title: '7. Student projects and innovation',
        paragraphs: [
          'Nexlynk may help students and graduates develop projects into market ready products, or enter innovation challenges and grant programmes. Where this happens, we will agree with you in writing how the project, its data and any intellectual property will be handled. Your personal data will not be shared with a grant body, competition or incubator without your knowledge.',
        ],
      },
      {
        id: 'security',
        title: '8. Data security',
        paragraphs: [
          'We take reasonable technical and organisational measures to protect your personal information against unauthorised access, loss, alteration, disclosure or destruction. These include access controls so that only authorised team members can view personal data, secure and reputable cloud storage, and password protected accounts. Profile images and CVs are stored in secure cloud storage, and CV access uses links that expire after a short time. No online system is completely secure, so we cannot guarantee absolute security. Please keep your login details private and tell us immediately if you suspect any misuse of your account.',
          'If a data breach occurs that is likely to put your rights at risk, we will notify the Office of the Data Protection Commissioner and affected individuals within the time required by law.',
        ],
      },
      {
        id: 'retention',
        title: '9. Data retention',
        paragraphs: ['We keep personal information only for as long as it is needed for the purposes in this policy. In general:'],
        items: [
          'Talent profile and training records are kept while you remain active in our talent pool and for a reasonable period afterwards so that we can support your career, verify programme completion and measure outcomes.',
          'Employer, partner, sponsor and mentor records are kept while the relationship continues and for a reasonable time afterwards.',
          'Applications from people who were not selected may be kept for a limited period for future cohorts unless you ask us to delete them.',
        ],
        after: [
          'When you ask us to close your account or delete your data, we will delete or anonymise it within a reasonable period, except where the law requires us to keep it.',
        ],
      },
      {
        id: 'transfers',
        title: '10. International transfers',
        paragraphs: [
          'Some of our service providers, such as cloud hosting and email providers, may store or process data outside Kenya. Where this happens, we take steps to ensure that your data remains protected and that the transfer complies with the Data Protection Act, 2019.',
        ],
      },
      {
        id: 'rights',
        title: '11. Your rights',
        paragraphs: ['Under the Data Protection Act, 2019 you have the right to:'],
        items: [
          'Be informed about how your personal data is used.',
          'Access the personal data we hold about you.',
          'Correct inaccurate or incomplete data.',
          'Delete your personal data, subject to legal exceptions.',
          'Object to or restrict processing of your data, including for direct marketing.',
          'Data portability: receive your data in a structured, commonly used format.',
          'Withdraw consent at any time, without affecting processing done before withdrawal.',
        ],
        after: [
          'To exercise any of these rights, email us at ' + CONTACT.email + '. We may need to confirm your identity first, and we will respond within a reasonable time and in line with the law. If you are unhappy with our response, you may lodge a complaint with the Office of the Data Protection Commissioner of Kenya (www.odpc.go.ke).',
        ],
      },
      {
        id: 'consent',
        title: '12. Consent',
        paragraphs: [
          'Where we rely on your consent, such as to share your profile with employers or to publish your photo, we will ask for it clearly. You can withdraw consent at any time by contacting us. Withdrawing consent may limit our ability to provide some services, for example we cannot present your profile to employers if you withdraw permission to share it.',
        ],
      },
      {
        id: 'children',
        title: '13. Children\'s privacy',
        paragraphs: [
          'Nexlynk is intended for students and graduates at a higher learning level and is not directed at children. Under Kenyan law, a child is a person under 18. We do not knowingly collect personal data from anyone under 18 without the consent of a parent or guardian. If you believe a child has given us personal data without that consent, please contact us and we will delete it.',
        ],
      },
      {
        id: 'cookies',
        title: '14. Cookies and analytics',
        paragraphs: [
          'Our website and platform may use cookies and similar technologies to keep you signed in, remember your preferences and understand how our services are used. You can control cookies through your browser settings, although some features may not work properly if you disable them.',
        ],
      },
      {
        id: 'links',
        title: '15. Third party links and social media',
        paragraphs: [
          'Our website, communications and social media pages may contain links to third party websites, including employer sites, training partners and social platforms. We are not responsible for the privacy practices of those third parties and encourage you to read their privacy policies.',
        ],
      },
      {
        id: 'changes',
        title: '16. Changes to this privacy policy',
        paragraphs: [
          'We may update this policy from time to time as our services, partnerships and legal requirements change. We will post the updated policy on our website and platform and change the "Last updated" date at the top. Where a change is significant, we will take reasonable steps to notify you. Please review this policy periodically.',
        ],
      },
      {
        id: 'contact',
        title: '17. Contact us',
        paragraphs: ['If you have questions about this Privacy Policy or how we handle your data, please contact us:'],
        table: CONTACT_TABLE,
      },
    ],
  },
}

function Bullets({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-ink-2">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function Paragraphs({ list }) {
  return list.map((text) => (
    <p key={text} className="text-sm leading-7 text-ink-2">
      {text}
    </p>
  ))
}

function DataTable({ table }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        {table.head && (
          <thead className="bg-brand-soft text-ink">
            <tr>
              {table.head.map((cell) => (
                <th key={cell} className="px-4 py-3 font-bold">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-line">
          {table.rows.map((row) => (
            <tr key={row[0]} className="align-top">
              {row.map((cell, i) => (
                <td
                  key={cell}
                  className={'px-4 py-3 leading-6 ' + (i === 0 ? 'font-bold text-ink' : 'text-ink-2')}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LegalPage({ kind = 'terms' }) {
  const doc = DOCUMENTS[kind] || DOCUMENTS.terms

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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="min-w-0 rounded-2xl border border-line bg-white px-6 py-8 shadow-card md:px-10">
            <p className="mb-2 text-xs font-bold uppercase text-brand">Nexlynk Engineers</p>
            <h1 className="text-3xl font-extrabold text-ink md:text-4xl">{doc.title}</h1>
            <p className="mt-2 text-sm italic text-ink-4">{doc.updated}</p>
            <p className="mt-4 border-b border-line pb-7 text-base leading-7 text-ink-3">{doc.intro}</p>

            <div className="divide-y divide-line">
              {doc.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-8 py-6">
                  <h2 className="text-lg font-extrabold text-ink">{section.title}</h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs && <Paragraphs list={section.paragraphs} />}
                    {section.items && <Bullets items={section.items} />}
                    {section.after && <Paragraphs list={section.after} />}
                    {section.subsections &&
                      section.subsections.map((sub) => (
                        <div key={sub.title} className="space-y-3 pt-2">
                          <h3 className="text-sm font-bold text-brand-ink">{sub.title}</h3>
                          {sub.paragraphs && <Paragraphs list={sub.paragraphs} />}
                          {sub.items && <Bullets items={sub.items} />}
                          {sub.after && <Paragraphs list={sub.after} />}
                        </div>
                      ))}
                    {section.table && <DataTable table={section.table} />}
                    {section.link && (
                      <Link to={section.link.to} className="inline-block text-sm font-semibold text-brand hover:underline">
                        {section.link.label}
                      </Link>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card lg:sticky lg:top-6">
            <h2 className="text-sm font-extrabold text-ink">On this page</h2>
            <nav aria-label="Page sections" className="mt-3 flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
              {doc.sections.map((section) => (
                <a
                  key={section.id}
                  href={'#' + section.id}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-3 hover:bg-brand-soft hover:text-brand-ink"
                >
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
}clea