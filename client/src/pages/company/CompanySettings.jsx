import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Icon from '@/components/Icon'
import StatusPill from '@/components/ui/StatusPill'
import { Link } from 'react-router-dom'
import { companyAPI, filesAPI } from '@/api/company'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Matches backend updateCompanySchema exactly
const schema = z.object({
  name:          z.string().min(2, 'Company name is required').max(200),
  industry:      z.string().max(100).optional().or(z.literal('')),
  company_size:  z.string().max(50).optional().or(z.literal('')),
  website:       z.string().url('Enter a valid URL (e.g. https://company.com)').optional().or(z.literal('')),
  description:   z.string().max(3000).optional().or(z.literal('')),
  contact_name:  z.string().max(100).optional().or(z.literal('')),
  contact_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  contact_phone: z.string().max(20).optional().or(z.literal('')),
})

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Agriculture', 'Healthcare',
  'Manufacturing', 'Retail & E-commerce', 'Media & Communications',
  'Education', 'Logistics & Transport', 'Energy', 'Real Estate',
  'Legal & Consulting', 'NGO & Non-profit', 'Government', 'Other',
]

const SIZES = [
  '1–10', '11–50', '51–200', '201–500', '500+',
]

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-2 mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-4">{hint}</p>}
      {error  && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )
}

export default function CompanySettings() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const logoRef = useRef()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)

  // ── Fetch existing profile ────────────────────────────
  const { data: profile, isPending, isError } = useQuery({
    queryKey: ['company-profile', user?.id],
    queryFn:  () => companyAPI.getProfile(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:          '',
      industry:      '',
      company_size:  '',
      website:       '',
      description:   '',
      contact_name:  '',
      contact_email: '',
      contact_phone: '',
    },
  })

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      reset({
        name:          profile.name          || '',
        industry:      profile.industry      || '',
        company_size:  profile.company_size  || '',
        website:       profile.website       || '',
        description:   profile.description   || '',
        contact_name:  profile.contact_name  || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
      })
      // Load logo if exists
      if (profile.logo_path) {
        filesAPI.logoSignedUrl(encodeURIComponent(profile.logo_path))
          .then(r => setLogoUrl(r.data?.url || r.data?.signedUrl))
          .catch(() => {})
      }
    }
  }, [profile, reset])

  // ── Update mutation ───────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (body) => companyAPI.update(user.id, body),
    onSuccess:  () => {
      toast.success('Company profile updated!')
      qc.invalidateQueries({ queryKey: ['company-profile', user?.id] })
    },
    onError: (e) => toast.error(e?.message || 'Update failed'),
  })

  const onSubmit = (values) => {
    // Strip empty strings so backend doesn't get blank required fields
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '')
    )
    updateMutation.mutate(clean)
  }

  // ── Logo upload ───────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return }
    setLogoUploading(true)
    try {
      await companyAPI.uploadLogo(user.id, file)
      toast.success('Logo uploaded!')
      qc.invalidateQueries({ queryKey: ['company-profile', user?.id] })
      // Preview immediately
      setLogoUrl(URL.createObjectURL(file))
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  const initials = (profile?.name || user?.name || 'CO')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  if (isPending) return (
    <div role="status" aria-label="Loading company profile" className="p-6 lg:p-8 max-w-3xl space-y-4">
      <div className="h-8 w-56 rounded bg-canvas-2 animate-shimmer" />
      {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-canvas-2 animate-shimmer" />)}
    </div>
  )

  if (isError) return (
    <div className="p-6 lg:p-8 flex justify-center">
      <div className="card w-full max-w-2xl p-10 text-center">
        <Icon name="alert-circle" size={28} className="mx-auto mb-3 text-warning" />
        <h1 className="mb-2 text-lg font-extrabold text-ink">Could not load company profile</h1>
        <p className="text-sm text-ink-3">Please try again shortly.</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-2xl">

        <div className="mb-7 animate-fade-up">
          <Link to="/company" className="flex items-center gap-2 text-sm text-ink-4 hover:text-brand mb-4 transition-colors w-fit">
            <Icon name="arrow-left" size={16} /> Back to dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-ink">Company Settings</h1>
              <p className="text-ink-3 text-sm mt-1">Keep your profile complete to build trust with applicants.</p>
            </div>
            {profile?.status === 'approved' && (
              <StatusPill status="approved" label="Verified" />
            )}
            {profile?.status === 'pending' && (
              <StatusPill status="pending" label="Awaiting approval" />
            )}
          </div>
        </div>

        {/* Awaiting approval notice */}
        {profile?.status === 'pending' && (
          <div className="bg-warning-light border border-warning/30 rounded-2xl px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-warning-dark">Your account is pending admin approval</p>
            <p className="text-xs text-warning-dark/70 mt-1">
              You can complete your profile now. Approval is usually within 24 hours.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* ── Logo ──────────────────────────────────────── */}
          <div className="card p-6">
            <h2 className="font-semibold text-ink border-b border-line pb-3 mb-5">Company logo</h2>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden border-2 border-line-2">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  disabled={logoUploading}
                  className="btn-secondary text-sm mb-2"
                >
                  {logoUploading
                    ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-line-3 border-t-slate-600 rounded-full animate-spin" /> Uploading...</span>
                    : <span className="flex items-center gap-2"><Icon name="upload" size={14} /> {logoUrl ? 'Change logo' : 'Upload logo'}</span>
                  }
                </button>
                <p className="text-xs text-ink-4">PNG, JPG or WebP · Max 2MB</p>
              </div>
              <input ref={logoRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* ── Company info ──────────────────────────────── */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-ink border-b border-line pb-3">Company information</h2>

            <Field label="Company name" required error={errors.name}>
              <input
                {...register('name')}
                className={clsx('input', errors.name && 'input-error')}
                placeholder="e.g. Safaricom PLC"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Industry" error={errors.industry}>
                <select {...register('industry')} className="input">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>

              <Field label="Company size" error={errors.company_size}>
                <select {...register('company_size')} className="input">
                  <option value="">Select size</option>
                  {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </Field>
            </div>

            <Field label="Website" error={errors.website} hint="Include https://">
              <input
                {...register('website')}
                className={clsx('input', errors.website && 'input-error')}
                placeholder="https://yourcompany.com"
              />
            </Field>

            <Field label="About the company" error={errors.description} hint="Max 3,000 characters">
              <textarea
                {...register('description')}
                rows={5}
                className={clsx('input resize-none', errors.description && 'input-error')}
                placeholder="Describe what your company does, your mission, culture, and what interns can expect..."
              />
            </Field>
          </div>

          {/* ── Contact person ────────────────────────────── */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-ink border-b border-line pb-3">Contact person</h2>
            <p className="text-xs text-ink-4 -mt-2">
              This person will be the primary point of contact for applicants and the platform.
            </p>

            <Field label="Contact name" error={errors.contact_name}>
              <input
                {...register('contact_name')}
                className={clsx('input', errors.contact_name && 'input-error')}
                placeholder="e.g. Jane Kamau"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Contact email" error={errors.contact_email}>
                <input
                  {...register('contact_email')}
                  type="email"
                  className={clsx('input', errors.contact_email && 'input-error')}
                  placeholder="hr@yourcompany.com"
                />
              </Field>

              <Field label="Contact phone" error={errors.contact_phone}>
                <input
                  {...register('contact_phone')}
                  className="input"
                  placeholder="+254 7XX XXX XXX"
                />
              </Field>
            </div>
          </div>

          {/* ── Profile completeness ─────────────────────── */}
          {profile && (
            <div className="card p-5">
              <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
                <Icon name="building" size={16} className="text-ink-4" /> Profile completeness
              </h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Company name',   done: !!profile.name         },
                  { label: 'Industry',        done: !!profile.industry     },
                  { label: 'Company size',    done: !!profile.company_size },
                  { label: 'Description',     done: !!profile.description  },
                  { label: 'Website',         done: !!profile.website      },
                  { label: 'Contact person',  done: !!profile.contact_name },
                  { label: 'Logo uploaded',   done: !!profile.logo_path    },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={clsx('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                      done ? 'bg-success-light' : 'bg-canvas-2'
                    )}>
                      {done
                        ? <Icon name="check-circle" size={12} className="text-success" />
                        : <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      }
                    </div>
                    <span className={clsx('text-sm', done ? 'text-ink-2' : 'text-ink-4')}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ──────────────────────────────────── */}
          <div className="flex gap-3 pb-8">
            <Link to="/company" className="btn btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary flex-[2]"
            >
              {updateMutation.isPending
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                )
                : 'Save changes'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}