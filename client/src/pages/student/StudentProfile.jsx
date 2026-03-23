import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle, Plus } from 'lucide-react'
import { studentAPI } from '@/api/client'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Matches backend updateProfileSchema exactly
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
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )
}

export default function StudentProfile() {
  const { user }  = useAuthStore()
  const qc        = useQueryClient()
  const fileRef   = useRef()
  const [skills,      setSkills]     = useState([])
  const [skillInput,  setSkillInput] = useState([])
  const [cvUploading, setCvUploading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn:  () => studentAPI.getProfile(user.id).then(r => r.data),
    enabled:  !!user?.id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '', phone: '', city: '',
      university: '', course: '', year_of_study: '',
      expected_graduation: '', discipline: '', availability: '', about: '',
    },
  })

  // Populate form and skills once profile loads
  useEffect(() => {
    if (!profile) return
    reset({
      name:                profile.name                || user?.name || '',
      phone:               profile.phone               || '',
      city:                profile.city                || '',
      university:          profile.university          || '',
      course:              profile.course              || '',
      year_of_study:       profile.year_of_study       || '',
      expected_graduation: profile.expected_graduation
        ? profile.expected_graduation.split('T')[0]   // format for date input
        : '',
      discipline:          profile.discipline          || '',
      availability:        profile.availability        || '',
      about:               profile.about               || '',
    })
    if (profile.skills?.length) setSkills(profile.skills)
  }, [profile, reset, user?.name])

  const updateMutation = useMutation({
    mutationFn: (body) => studentAPI.updateProfile(user.id, body),
    onSuccess:  () => {
      toast.success('Profile updated!')
      qc.invalidateQueries(['student-profile', user?.id])
    },
    onError: (e) => toast.error(e?.message || 'Update failed'),
  })

  const onSubmit = (values) => {
    // Strip empty strings so server doesn't reject optional fields
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    updateMutation.mutate({ ...clean, skills })
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 30) {
      setSkills(prev => [...prev, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s) => setSkills(skills.filter(x => x !== s))

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Server only accepts PDF
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
      qc.invalidateQueries(['student-profile', user?.id])
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setCvUploading(false)
      e.target.value = ''
    }
  }

  const completion = profile?.profile_completion ?? 0

  if (isLoading) return (
    <div className="p-8 max-w-3xl space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Keep your profile up to date to match more opportunities.</p>
      </motion.div>

      {/* Profile completion */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-navy">Profile strength</p>
          <span className="text-sm font-bold text-blue-DEFAULT">{completion}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-DEFAULT rounded-full transition-all duration-700"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="text-xs text-slate-400 mt-2">
            Add more details to strengthen your profile.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

        {/* Personal */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3">Personal information</h2>

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
              placeholder="e.g. Available from June 2025, full-time"
            />
          </Field>
        </div>

        {/* Academic */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3">Academic details</h2>

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
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                <option value="7">Postgraduate</option>
                <option value="8">Recent Graduate</option>
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Discipline / Field" error={errors.discipline}>
              <select {...register('discipline')} className="input">
                <option value="">Select discipline</option>
                {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Expected graduation" error={errors.expected_graduation}>
              <input
                {...register('expected_graduation')}
                type="date"
                className="input"
              />
            </Field>
          </div>
        </div>

        {/* About */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">About me</h2>
          <Field label="Bio" error={errors.about}>
            <textarea
              {...register('about')}
              rows={4}
              className="input resize-none"
              placeholder="Write a short bio about yourself, your interests, and career goals..."
            />
          </Field>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="text-blue-400 hover:text-danger transition-colors">
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
              placeholder="Type a skill and press Enter (e.g. Python, React)"
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">{skills.length}/30 skills</p>
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

      {/* CV Upload — separate from the form, PDF only */}
      <div className="card p-6 mt-5">
        <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">
          Curriculum Vitae (CV)
        </h2>
        {profile?.cv_path ? (
          <div className="flex items-center gap-3 bg-success-light border border-success/20 rounded-xl px-4 py-3.5">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success-dark">CV uploaded ✓</p>
              <p className="text-xs text-success-dark/70 mt-0.5">
                Automatically attached to all your applications.
              </p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary btn-sm text-xs"
            >Replace</button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-DEFAULT hover:bg-blue-50/30 transition-all group"
          >
            <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-DEFAULT mx-auto mb-3 transition-colors" />
            <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-DEFAULT">
              Click to upload your CV
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF only · Max 5MB</p>
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
          <div className="flex items-center gap-2 mt-3 text-sm text-blue-DEFAULT">
            <span className="w-4 h-4 border-2 border-blue-DEFAULT/30 border-t-blue-DEFAULT rounded-full animate-spin" />
            Uploading...
          </div>
        )}
      </div>
    </div>
  )
}