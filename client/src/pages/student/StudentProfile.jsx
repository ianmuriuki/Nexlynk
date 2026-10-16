import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import Icon from '@/components/Icon'
import { supabase } from '@/lib/supabase'
import { studentAPI } from '@/api/opportunities'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = z.object({
  name:                z.string().min(2, 'Name is required').max(100),
  phone:               z.string().max(20).optional().or(z.literal('')),
  city:                z.string().max(100).optional().or(z.literal('')),
  university:          z.string().max(200).optional().or(z.literal('')),
  course:              z.string().max(200).optional().or(z.literal('')),
  year_of_study:       z.coerce.number().int().min(1).max(10).optional().or(z.literal('')),
  expected_graduation: z.string().optional().or(z.literal('')),
  discipline:          z.string().max(100).optional().or(z.literal('')),
  availability:        z.string().max(200).optional().or(z.literal('')),
  about:               z.string().max(2000).optional().or(z.literal('')),
})

const DISCIPLINES = [
  'Computer Science', 'Information Technology', 'Software Engineering',
  'Data Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Business Administration', 'Finance & Accounting',
  'Marketing', 'Human Resources', 'Design & UX', 'Law',
  'Medicine & Health', 'Agriculture', 'Education', 'Media & Communications', 'Other',
]

const YEARS = [1, 2, 3, 4, 5, 6]

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-2 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )
}

async function fetchProfile(id) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function saveProfile(id, body) {
  const { data, error } = await supabase
    .from('student_profiles')
    .update(body)
    .eq('id', id)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Profile not found or not allowed to update it')
}

export default function StudentProfile() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [cvUploading, setCvUploading] = useState(false)

  const profileKey = ['student-profile', user?.id]

  const { data: profile, isPending, isError } = useQuery({
    queryKey: profileKey,
    queryFn: () => fetchProfile(user.id),
    enabled: !!user?.id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '', phone: '', city: '',
      university: '', course: '', year_of_study: '',
      expected_graduation: '', discipline: '', availability: '', about: '',
    },
  })

  useEffect(() => {
    if (!profile) return
    reset({
      name:                profile.name || user?.name || '',
      phone:               profile.phone || '',
      city:                profile.city || '',
      university:          profile.university || '',
      course:              profile.course || '',
      year_of_study:       profile.year_of_study || '',
      expected_graduation: profile.expected_graduation || '',
      discipline:          profile.discipline || '',
      availability:        profile.availability || '',
      about:               profile.about || '',
    })
    if (Array.isArray(profile.skills)) setSkills(profile.skills)
  }, [profile, reset, user?.name])

  const updateMutation = useMutation({
    mutationFn: (body) => saveProfile(user.id, body),
    onSuccess: () => {
      toast.success('Profile updated!')
      qc.invalidateQueries({ queryKey: profileKey })
    },
    onError: (e) => toast.error(e?.message || 'Update failed'),
  })

  const onSubmit = (values) => {
    const body = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === '' || v === undefined ? null : v])
    )
    updateMutation.mutate({ ...body, skills })
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 30) {
      setSkills((prev) => [...prev, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s) => setSkills(skills.filter((x) => x !== s))

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      return
    }
    setCvUploading(true)
    try {
      await studentAPI.uploadCV(user.id, file)
      toast.success('CV uploaded!')
      qc.invalidateQueries({ queryKey: profileKey })
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setCvUploading(false)
      e.target.value = ''
    }
  }

  const completion = profile?.profile_completion ?? 0

  if (isPending) return (
    <div role="status" aria-label="Loading profile" className="p-6 lg:p-8 max-w-3xl space-y-4">
      <div className="h-8 w-48 rounded bg-canvas-2 animate-shimmer" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-canvas-2 animate-shimmer" />
      ))}
    </div>
  )

  if (isError) return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="card p-10 text-center">
        <Icon name="alert-circle" size={28} className="mx-auto mb-3 text-warning" />
        <h1 className="mb-2 text-lg font-extrabold text-ink">Could not load your profile</h1>
        <p className="text-sm text-ink-3">Please try again shortly.</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-7 animate-fade-up">
        <h1 className="text-2xl font-extrabold text-ink">My Profile</h1>
        <p className="text-ink-3 text-sm mt-1">Keep your profile up to date to match more opportunities.</p>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-ink">Profile strength</p>
          <span className="text-sm font-bold text-ink">{completion}%</span>
        </div>
        <div className="h-2 bg-canvas-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-700"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="text-xs text-ink-4 mt-2">
            Add more details to strengthen your profile.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink border-b border-line pb-3">Personal information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" required error={errors.name}>
              <input {...register('name')} className={clsx('input', errors.name && 'input-error')} placeholder="Jane Muthoni" />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <input {...register('phone')} className="input" placeholder="+254 7XX XXX XXX" />
            </Field>
          </div>

          <Field label="City" error={errors.city}>
            <input {...register('city')} className="input" placeholder="Nairobi" />
          </Field>

          <Field label="Availability" error={errors.availability}>
            <input
              {...register('availability')}
              className="input"
              placeholder="e.g. Available from June 2026, full time"
            />
          </Field>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink border-b border-line pb-3">Academic details</h2>

          <Field label="University / Institution" error={errors.university}>
            <input {...register('university')} className="input" placeholder="Technical University of Mombasa" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Course / Programme" error={errors.course}>
              <input {...register('course')} className="input" placeholder="Bachelor of Information Technology" />
            </Field>
            <Field label="Year of study" error={errors.year_of_study}>
              <select {...register('year_of_study')} className="input">
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                <option value="7">Postgraduate</option>
                <option value="8">Recent Graduate</option>
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Discipline / Field" error={errors.discipline}>
              <select {...register('discipline')} className="input">
                <option value="">Select discipline</option>
                {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Expected graduation" error={errors.expected_graduation}>
              <input {...register('expected_graduation')} type="date" className="input" />
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink border-b border-line pb-3 mb-4">About me</h2>
          <Field label="Bio" error={errors.about}>
            <textarea
              {...register('about')}
              rows={4}
              className="input resize-none"
              placeholder="Write a short bio about yourself, your interests, and career goals..."
            />
          </Field>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink border-b border-line pb-3 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-brand-soft text-brand-ink rounded-full border border-brand-soft">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="text-brand-strong hover:text-danger transition-colors">
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
              placeholder="Type a skill and press Enter (e.g. Python, React)"
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-4">
              <Icon name="plus" size={16} />
            </button>
          </div>
          <p className="text-xs text-ink-4 mt-2">{skills.length}/30 skills</p>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn-primary w-full py-3 text-sm"
        >
          {updateMutation.isPending
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
            : 'Save profile'
          }
        </button>
      </form>

      <div className="card p-6 mt-5">
        <h2 className="font-semibold text-ink border-b border-line pb-3 mb-4">
          Curriculum Vitae (CV)
        </h2>
        {profile?.cv_path ? (
          <div className="flex items-center gap-3 bg-success-light border border-success/20 rounded-xl px-4 py-3.5">
            <Icon name="check-circle" size={20} className="shrink-0 text-success" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success-dark">CV uploaded</p>
              <p className="text-xs text-success-dark/70 mt-0.5">
                Automatically attached to all your applications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-secondary btn-sm text-xs"
            >Replace</button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-line-2 rounded-2xl p-10 text-center cursor-pointer hover:border-brand hover:bg-brand-softer/30 transition-all group"
          >
            <Icon name="upload" size={32} className="mx-auto mb-3 text-ink-4 transition-colors group-hover:text-brand" />
            <p className="text-sm font-semibold text-ink-2 group-hover:text-brand">
              Click to upload your CV
            </p>
            <p className="text-xs text-ink-4 mt-1">PDF only · Max 5MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleCVUpload}
        />
        {cvUploading && (
          <div className="flex items-center gap-2 mt-3 text-sm text-ink">
            <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            Uploading...
          </div>
        )}
      </div>
    </div>
  )
}
