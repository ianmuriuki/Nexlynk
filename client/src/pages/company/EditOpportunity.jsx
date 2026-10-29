import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Icon from '@/components/Icon'
import { companyAPI } from '@/api/company'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

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
  status:               z.enum(['draft', 'published']).optional(),
})

const DISCIPLINE_OPTIONS = [
  'Computer Science', 'Information Technology', 'Software Engineering',
  'Data Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Mechatronic Engineering',
  'Civil Engineering', 'Business Administration', 'Finance & Accounting',
  'Marketing', 'Human Resources', 'Design & UX', 'Law',
  'Medicine & Health', 'Agriculture', 'Education', 'Media & Communications', 'Other',
]

function FieldWrapper({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-2 mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )
}

export default function EditOpportunity() {
  const { id }   = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const [disciplines, setDisciplines] = useState([])
  const [discInput,   setDiscInput]   = useState('')
  const [skills,      setSkills]      = useState([])
  const [skillInput,  setSkillInput]  = useState('')
  const [arrayErrors, setArrayErrors] = useState({})

  const { data: opp, isPending, isError } = useQuery({
    queryKey: ['company-opportunity', user?.id, id],
    queryFn:  () => companyAPI.getOpportunity(user.id, id).then((r) => r.data.data),
    enabled:  !!user?.id && !!id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { positions: 1 },
  })

  const editableStatus = !!opp && ['draft', 'published'].includes(opp.status)

  useEffect(() => {
    if (!opp) return
    reset({
      title:                opp.title || '',
      description:          opp.description || '',
      type:                 opp.type || '',
      location:             opp.location || '',
      positions:            opp.positions || 1,
      duration:             opp.duration || '',
      stipend:              opp.stipend || '',
      application_deadline: opp.application_deadline ? String(opp.application_deadline).slice(0, 10) : '',
      status:               ['draft', 'published'].includes(opp.status) ? opp.status : undefined,
    })
    setDisciplines(Array.isArray(opp.disciplines) ? opp.disciplines : [])
    setSkills(Array.isArray(opp.skills_required) ? opp.skills_required : [])
  }, [opp, reset])

  const mutation = useMutation({
    mutationFn: (body) => companyAPI.updateOpportunity(user.id, id, body),
    onSuccess: async () => {
      toast.success('Opportunity updated')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['company-opportunities', user?.id] }),
        qc.invalidateQueries({ queryKey: ['company-opportunity', user?.id, id] }),
        qc.invalidateQueries({ queryKey: ['homepage-jobs'] }),
        qc.invalidateQueries({ queryKey: ['opportunities'] }),
      ])
      navigate('/company')
    },
    onError: (e) => toast.error(e?.message || 'Could not update the opportunity'),
  })

  const addDisc = (val) => {
    const d = (val || discInput).trim()
    if (d && !disciplines.includes(d)) {
      setDisciplines((prev) => [...prev, d])
      setDiscInput('')
      setArrayErrors((e) => ({ ...e, disciplines: '' }))
    }
  }
  const removeDisc = (d) => setDisciplines(disciplines.filter((x) => x !== d))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills((prev) => [...prev, s])
      setSkillInput('')
      setArrayErrors((e) => ({ ...e, skills: '' }))
    }
  }
  const removeSkill = (s) => setSkills(skills.filter((x) => x !== s))

  const onSubmit = (values) => {
    const errs = {}
    if (disciplines.length === 0) errs.disciplines = 'Add at least one discipline'
    if (skills.length === 0)      errs.skills      = 'Add at least one required skill'
    if (Object.keys(errs).length) { setArrayErrors(errs); return }

    const payload = {
      title:                values.title,
      description:          values.description,
      type:                 values.type,
      location:             values.location || null,
      positions:            values.positions || 1,
      duration:             values.duration || null,
      stipend:              values.stipend || null,
      application_deadline: values.application_deadline || null,
      disciplines,
      skills_required: skills,
    }
    if (editableStatus && values.status) payload.status = values.status
    mutation.mutate(payload)
  }

  if (isPending) return (
    <div role="status" aria-label="Loading opportunity" className="p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="h-8 w-56 rounded bg-canvas-2 animate-shimmer" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-canvas-2 animate-shimmer" />)}
      </div>
    </div>
  )

  if (isError || !opp) return (
    <div className="p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="card w-full max-w-2xl p-10 text-center">
        <Icon name="alert-circle" size={28} className="mx-auto mb-3 text-warning" />
        <h1 className="mb-2 text-lg font-extrabold text-ink">Could not load this opportunity</h1>
        <p className="text-sm text-ink-3 mb-4">It may have been removed, or it belongs to another company.</p>
        <Link to="/company" className="btn-primary btn-sm inline-flex">Back to dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full min-w-0 max-w-2xl">

        <div className="mb-7 animate-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-ink-4 hover:text-ink mb-4 transition-colors"
          >
            <Icon name="arrow-left" size={16} /> Back
          </button>
          <h1 className="text-2xl font-extrabold text-ink">Edit Opportunity</h1>
          <p className="text-ink-3 text-sm mt-1">Fix or update the details. Changes to a published post go live as soon as you save.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          <div className="card p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-ink border-b border-line pb-3">Opportunity details</h2>

            <FieldWrapper label="Job title" required error={errors.title}>
              <input
                {...register('title')}
                className={clsx('input', errors.title && 'input-error')}
                placeholder="e.g. Backend Developer Intern"
              />
            </FieldWrapper>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="Location" error={errors.location}>
                <input {...register('location')} className="input" placeholder="e.g. Nairobi / Remote" />
              </FieldWrapper>

              <FieldWrapper label="Duration" error={errors.duration}>
                <input {...register('duration')} className="input" placeholder="e.g. 3 months" />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="Stipend / Salary" error={errors.stipend}>
                <input {...register('stipend')} className="input" placeholder="e.g. KES 20,000/mo" />
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

          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink border-b border-line pb-3 mb-4">Description</h2>
            <FieldWrapper label="Role description" required error={errors.description}>
              <textarea
                {...register('description')}
                rows={6}
                className={clsx('input resize-none', errors.description && 'input-error')}
                placeholder="Describe the role, responsibilities, and what applicants will learn or work on..."
              />
            </FieldWrapper>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink border-b border-line pb-3 mb-1">
              Target disciplines <span className="text-danger">*</span>
            </h2>
            <p className="text-xs text-ink-4 mb-4">Select the academic disciplines this role is suited for.</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {DISCIPLINE_OPTIONS.map((d) => {
                const selected = disciplines.includes(d)
                return (
                  <button
                    key={d} type="button"
                    onClick={() => (selected ? removeDisc(d) : addDisc(d))}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      selected
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-ink-3 border-line-2 hover:border-brand hover:text-brand'
                    )}
                  >{d}</button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <input
                value={discInput}
                onChange={(e) => setDiscInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDisc() } }}
                className="input flex-1"
                placeholder="Or type a custom discipline..."
              />
              <button type="button" onClick={() => addDisc()} className="btn-secondary px-4" aria-label="Add discipline">
                <Icon name="plus" size={16} />
              </button>
            </div>

            {arrayErrors.disciplines && <p className="mt-2 text-xs text-danger">{arrayErrors.disciplines}</p>}

            {disciplines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
                <span className="text-xs text-ink-4 self-center">Selected:</span>
                {disciplines.map((d) => (
                  <span key={d} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-brand-soft text-brand-ink rounded-full border border-brand-soft">
                    {d}
                    <button type="button" onClick={() => removeDisc(d)} className="text-brand-strong hover:text-danger" aria-label={'Remove ' + d}>
                      <Icon name="x" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink border-b border-line pb-3 mb-4">
              Required skills <span className="text-danger">*</span>
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-brand-soft text-brand-ink rounded-full border border-brand-soft">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="text-brand-strong hover:text-danger" aria-label={'Remove ' + s}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                className="input flex-1"
                placeholder="e.g. Python, React, Excel, press Enter to add"
              />
              <button type="button" onClick={addSkill} className="btn-secondary px-4" aria-label="Add skill">
                <Icon name="plus" size={16} />
              </button>
            </div>

            {arrayErrors.skills && <p className="mt-2 text-xs text-danger">{arrayErrors.skills}</p>}
            <p className="text-xs text-ink-4 mt-2">{skills.length}/15 skills added</p>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Publishing</h2>
            {editableStatus ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                {[
                  { val: 'published', label: 'Published', desc: 'Visible to all students' },
                  { val: 'draft',     label: 'Draft',     desc: 'Hidden until you publish it' },
                ].map(({ val, label, desc }) => (
                  <label key={val} className="flex items-start gap-3 cursor-pointer flex-1 bg-canvas border border-line-2 rounded-xl p-3.5 hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft/40">
                    <input {...register('status')} type="radio" value={val} className="accent-brand mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-ink-2">{label}</p>
                      <p className="text-xs text-ink-4 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-3">
                This opportunity is currently <span className="font-semibold capitalize">{String(opp.status).replace(/_/g, ' ')}</span>. Its status is not changed by this form.
              </p>
            )}
          </div>

          <div className="flex gap-3 pb-8">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 py-3">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-[2] py-3">
              {mutation.isPending
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
