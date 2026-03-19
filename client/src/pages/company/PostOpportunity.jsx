import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, X, ArrowLeft } from 'lucide-react'
import { companyAPI } from '@/api/client'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Matches backend createOpportunitySchema exactly
const schema = z.object({
  title:                z.string().min(3, 'Title is required'),
  description:          z.string().min(10, 'Description must be at least 10 characters'),
  type:                 z.enum(['internship', 'part-time', 'contract', 'full-time'], {
                          required_error: 'Select an opportunity type',
                        }),
  location:             z.string().min(2, 'Location is required').optional().or(z.literal('')),
  positions:            z.coerce.number().int().min(1).max(500).optional(),
  duration:             z.string().max(100).optional().or(z.literal('')),
  stipend:              z.string().max(100).optional().or(z.literal('')),
  application_deadline: z.string().optional().or(z.literal('')),
  status:               z.enum(['draft', 'published']).default('published'),
})

const DISCIPLINE_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Data Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Finance & Accounting',
  'Marketing',
  'Human Resources',
  'Design & UX',
  'Law',
  'Medicine & Health',
  'Agriculture',
  'Education',
  'Media & Communications',
  'Other',
]

function FieldWrapper({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )
}

export default function PostOpportunity() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [loading,  setLoading]   = useState(false)

  // disciplines — required array (min 1)
  const [disciplines,   setDisciplines]   = useState([])
  const [discInput,     setDiscInput]     = useState('')

  // skills_required — required array (min 1)
  const [skills,        setSkills]        = useState([])
  const [skillInput,    setSkillInput]    = useState('')

  // Form errors for arrays (not covered by zod)
  const [arrayErrors, setArrayErrors] = useState({})

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { positions: 1, status: 'published' },
  })

  // ── Disciplines helpers ─────────────────────────────────
  const addDisc = (val) => {
    const d = (val || discInput).trim()
    if (d && !disciplines.includes(d)) {
      setDisciplines(prev => [...prev, d])
      setDiscInput('')
      setArrayErrors(e => ({ ...e, disciplines: '' }))
    }
  }
  const removeDisc = (d) => setDisciplines(disciplines.filter(x => x !== d))

  // ── Skills helpers ──────────────────────────────────────
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills(prev => [...prev, s])
      setSkillInput('')
      setArrayErrors(e => ({ ...e, skills: '' }))
    }
  }
  const removeSkill = (s) => setSkills(skills.filter(x => x !== s))

  // ── Submit ──────────────────────────────────────────────
  const onSubmit = async (values) => {
    // Validate arrays manually
    const errs = {}
    if (disciplines.length === 0) errs.disciplines = 'Add at least one discipline'
    if (skills.length === 0)      errs.skills      = 'Add at least one required skill'
    if (Object.keys(errs).length) { setArrayErrors(errs); return }

    setLoading(true)
    try {
      const payload = {
        ...values,
        disciplines,
        skills_required: skills,
        // Send empty strings as undefined so backend doesn't choke
        location:             values.location             || undefined,
        duration:             values.duration             || undefined,
        stipend:              values.stipend              || undefined,
        application_deadline: values.application_deadline || undefined,
      }
      await companyAPI.postOpportunity(user.id, payload)
      toast.success('Opportunity posted successfully!')
      navigate('/company')
    } catch (e) {
      if (e?.details?.length) toast.error(e.details.map(d => d.message).join(', '))
      else toast.error(e?.message || 'Failed to post opportunity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-2xl">

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-navy mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="font-serif text-2xl font-bold text-navy">Post an Opportunity</h1>
          <p className="text-slate-500 text-sm mt-1">Fill in the details to attract qualified applicants.</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* ── Basic details ─────────────────────────── */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-navy border-b border-slate-100 pb-3">Opportunity details</h2>

            <FieldWrapper label="Job title" required error={errors.title}>
              <input
                {...register('title')}
                className={clsx('input', errors.title && 'input-error')}
                placeholder="e.g. Backend Developer Intern"
              />
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Type" required error={errors.type}>
                <select {...register('type')} className={clsx('input', errors.type && 'input-error')}>
                  <option value="">Select type</option>
                  <option value="internship">Internship</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="full-time">Full-time</option>
                </select>
              </FieldWrapper>

              <FieldWrapper label="Number of positions" error={errors.positions}>
                <input
                  {...register('positions')}
                  type="number" min="1" max="500"
                  className={clsx('input', errors.positions && 'input-error')}
                  placeholder="1"
                />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Location" error={errors.location}>
                <input
                  {...register('location')}
                  className="input"
                  placeholder="e.g. Nairobi / Remote"
                />
              </FieldWrapper>

              <FieldWrapper label="Duration" error={errors.duration}>
                <input
                  {...register('duration')}
                  className="input"
                  placeholder="e.g. 3 months"
                />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Stipend / Salary" error={errors.stipend}>
                <input
                  {...register('stipend')}
                  className="input"
                  placeholder="e.g. KES 20,000/mo"
                />
              </FieldWrapper>

              <FieldWrapper label="Application deadline" error={errors.application_deadline}>
                <input
                  {...register('application_deadline')}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                />
              </FieldWrapper>
            </div>
          </div>

          {/* ── Description ───────────────────────────── */}
          <div className="card p-6">
            <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">Description</h2>
            <FieldWrapper label="Role description" required error={errors.description}>
              <textarea
                {...register('description')}
                rows={6}
                className={clsx('input resize-none', errors.description && 'input-error')}
                placeholder="Describe the role, responsibilities, and what applicants will learn or work on..."
              />
            </FieldWrapper>
          </div>

          {/* ── Disciplines (required) ─────────────────── */}
          <div className="card p-6">
            <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-1">
              Target disciplines <span className="text-danger">*</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Select the academic disciplines this role is suited for.</p>

            {/* Quick-select chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DISCIPLINE_OPTIONS.map(d => {
                const selected = disciplines.includes(d)
                return (
                  <button
                    key={d} type="button"
                    onClick={() => selected ? removeDisc(d) : addDisc(d)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      selected
                        ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-DEFAULT hover:text-blue-DEFAULT'
                    )}
                  >{d}</button>
                )
              })}
            </div>

            {/* Custom discipline input */}
            <div className="flex gap-2">
              <input
                value={discInput}
                onChange={e => setDiscInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDisc() } }}
                className="input flex-1"
                placeholder="Or type a custom discipline..."
              />
              <button type="button" onClick={() => addDisc()} className="btn-secondary px-4">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {arrayErrors.disciplines && (
              <p className="mt-2 text-xs text-danger">{arrayErrors.disciplines}</p>
            )}

            {disciplines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400 self-center">Selected:</span>
                {disciplines.map(d => (
                  <span key={d} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                    {d}
                    <button type="button" onClick={() => removeDisc(d)} className="text-blue-400 hover:text-danger">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Required skills (required) ─────────────── */}
          <div className="card p-6">
            <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">
              Required skills <span className="text-danger">*</span>
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="text-blue-400 hover:text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                className="input flex-1"
                placeholder="e.g. Python, React, Excel — press Enter to add"
              />
              <button type="button" onClick={addSkill} className="btn-secondary px-4">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {arrayErrors.skills && (
              <p className="mt-2 text-xs text-danger">{arrayErrors.skills}</p>
            )}
            <p className="text-xs text-slate-400 mt-2">{skills.length}/15 skills added</p>
          </div>

          {/* ── Publishing ─────────────────────────────── */}
          <div className="card p-5">
            <h2 className="font-semibold text-navy mb-3">Publishing</h2>
            <div className="flex gap-5">
              {[
                { val: 'published', label: '🟢 Publish now',    desc: 'Visible to all students immediately' },
                { val: 'draft',     label: '📝 Save as draft',  desc: 'Save and publish later' },
              ].map(({ val, label, desc }) => (
                <label key={val} className="flex items-start gap-3 cursor-pointer flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-blue-DEFAULT transition-colors has-[:checked]:border-blue-DEFAULT has-[:checked]:bg-blue-50/40">
                  <input {...register('status')} type="radio" value={val} className="accent-blue-DEFAULT mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Actions ────────────────────────────────── */}
          <div className="flex gap-3 pb-8">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 py-3">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-[2] py-3">
              {loading
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting...
                  </span>
                )
                : 'Post opportunity'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}