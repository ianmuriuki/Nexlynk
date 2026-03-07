import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { studentAPI } from '@/api/client'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = z.object({
  name:       z.string().min(2, 'Name is required'),
  university: z.string().optional(),
  course:     z.string().optional(),
  year:       z.string().optional(),
  about:      z.string().max(500).optional(),
  phone:      z.string().optional(),
  location:   z.string().optional(),
})

export default function StudentProfile() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState([])
  const [cvUploading, setCvUploading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn:  () => studentAPI.getProfile(user.id).then(r => r.data),
    enabled:  !!user?.id,
    onSuccess: (data) => {
      if (data?.skills?.length) setSkills(data.skills)
      if (data) reset({
        name:       data.name       || user?.name || '',
        university: data.university || '',
        course:     data.course     || '',
        year:       data.year       || '',
        about:      data.about      || '',
        phone:      data.phone      || '',
        location:   data.location   || '',
      })
    }
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:       user?.name || '',
      university: '',
      course:     '',
      year:       '',
      about:      '',
      phone:      '',
      location:   '',
    }
  })

  const updateMutation = useMutation({
    mutationFn: (body) => studentAPI.updateProfile(user.id, body),
    onSuccess:  () => { toast.success('Profile updated!'); qc.invalidateQueries(['student-profile', user?.id]) },
    onError:    (e) => toast.error(e?.message || 'Update failed'),
  })

  const onSubmit = (values) => updateMutation.mutate({ ...values, skills })

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s) => setSkills(skills.filter(x => x !== s))

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    if (!['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast.error('Only PDF or Word files allowed'); return
    }
    setCvUploading(true)
    try {
      await studentAPI.uploadCV(user.id, file)
      toast.success('CV uploaded successfully!')
      qc.invalidateQueries(['student-profile', user?.id])
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setCvUploading(false)
    }
  }

  const completion = profile?.profile_completion ?? 0

  if (isLoading) return (
    <div className="p-8 max-w-3xl space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <h1 className="font-serif text-2xl font-bold text-navy">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Keep your profile up to date to match more opportunities.</p>
      </motion.div>

      {/* Completion bar */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-navy">Profile strength</p>
          <span className="text-sm font-bold text-blue-DEFAULT">{completion}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-DEFAULT rounded-full transition-all duration-700" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && <p className="text-xs text-slate-400 mt-2">Add more details to strengthen your profile and appear in more searches.</p>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-navy text-base border-b border-slate-100 pb-3">Personal information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name *</label>
              <input {...register('name')} className={clsx('input', errors.name && 'input-error')} placeholder="Jane Muthoni" />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone number</label>
              <input {...register('phone')} className="input" placeholder="+254 7XX XXX XXX" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
            <input {...register('location')} className="input" placeholder="Nairobi, Kenya" />
          </div>
        </div>

        {/* Academic */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-navy text-base border-b border-slate-100 pb-3">Academic details</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">University / Institution</label>
            <input {...register('university')} className="input" placeholder="University of Nairobi" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course / Programme</label>
              <input {...register('course')} className="input" placeholder="Computer Science" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year of study</label>
              <select {...register('year')} className="input">
                <option value="">Select year</option>
                {['Year 1','Year 2','Year 3','Year 4','Postgraduate','Recent Graduate'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy text-base border-b border-slate-100 pb-3 mb-4">About me</h2>
          <textarea
            {...register('about')}
            rows={4}
            className="input resize-none"
            placeholder="Write a short bio about yourself, your interests, and career goals..."
          />
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy text-base border-b border-slate-100 pb-3 mb-4">Skills</h2>
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
              placeholder="Type a skill and press Enter (e.g. Python, React, Excel)"
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">{skills.length}/15 skills added</p>
        </div>

        {/* Save */}
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

      {/* CV Upload */}
      <div className="card p-6 mt-6">
        <h2 className="font-semibold text-navy text-base border-b border-slate-100 pb-3 mb-4">Curriculum Vitae (CV)</h2>
        {profile?.cv_path
          ? (
            <div className="flex items-center gap-3 bg-success-light border border-success/20 rounded-xl px-4 py-3.5">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-success-dark">CV uploaded successfully</p>
                <p className="text-xs text-success-dark/70 mt-0.5">Your CV is attached to all applications automatically.</p>
              </div>
              <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm text-xs">Replace</button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-DEFAULT hover:bg-blue-50/30 transition-all group"
            >
              <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-DEFAULT mx-auto mb-3 transition-colors" />
              <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-DEFAULT">Click to upload your CV</p>
              <p className="text-xs text-slate-400 mt-1">PDF or Word · Max 5MB</p>
            </div>
          )
        }
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} />
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
