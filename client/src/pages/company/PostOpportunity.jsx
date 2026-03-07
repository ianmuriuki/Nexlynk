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

const schema = z.object({
  title:       z.string().min(3, 'Title is required'),
  type:        z.enum(['internship','attachment','graduate'], { required_error: 'Select a type' }),
  location:    z.string().min(2, 'Location is required'),
  positions:   z.coerce.number().min(1).max(50),
  stipend:     z.coerce.number().min(0).optional(),
  deadline:    z.string().optional(),
  description: z.string().min(20, 'Add a description (min 20 characters)'),
  status:      z.enum(['draft','published']).default('published'),
})

export default function PostOpportunity() {
  const { user }  = useAuthStore()
  const navigate  = useNavigate()
  const [skills, setSkills]     = useState([])
  const [skillInput, setSkill]  = useState('')
  const [loading, setLoading]   = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { positions: 1, status: 'published' }
  })

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 12) { setSkills([...skills, s]); setSkill('') }
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      await companyAPI.postOpportunity(user.id, { ...values, required_skills: skills })
      toast.success('Opportunity posted successfully!')
      navigate('/company')
    } catch (e) {
      if (e?.details?.length) toast.error(e.details.map(d => d.message).join(', '))
      else toast.error(e?.message || 'Failed to post')
    } finally {
      setLoading(false)
    }
  }

  const F = ({ label, error, required, children }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-7">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-navy mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-serif text-2xl font-bold text-navy">Post an Opportunity</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the details to attract qualified applicants.</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

        {/* Basic */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3">Opportunity details</h2>

          <F label="Title" required error={errors.title}>
            <input {...register('title')} className={clsx('input', errors.title && 'input-error')} placeholder="e.g. Backend Developer Intern" />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="Type" required error={errors.type}>
              <select {...register('type')} className={clsx('input', errors.type && 'input-error')}>
                <option value="">Select type</option>
                <option value="internship">Internship</option>
                <option value="attachment">Attachment</option>
                <option value="graduate">Graduate trainee</option>
              </select>
            </F>
            <F label="Positions" required error={errors.positions}>
              <input {...register('positions')} type="number" min="1" max="50" className={clsx('input', errors.positions && 'input-error')} placeholder="1" />
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Location" required error={errors.location}>
              <input {...register('location')} className={clsx('input', errors.location && 'input-error')} placeholder="e.g. Nairobi / Remote" />
            </F>
            <F label="Monthly stipend (KES)" error={errors.stipend}>
              <input {...register('stipend')} type="number" min="0" className="input" placeholder="e.g. 20000" />
            </F>
          </div>

          <F label="Application deadline" error={errors.deadline}>
            <input {...register('deadline')} type="date" min={new Date().toISOString().split('T')[0]} className="input" />
          </F>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">Description</h2>
          <F label="Role description" required error={errors.description}>
            <textarea
              {...register('description')}
              rows={6}
              className={clsx('input resize-none', errors.description && 'input-error')}
              placeholder="Describe the role, responsibilities, and what the intern will learn..."
            />
          </F>
        </div>

        {/* Required skills */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy border-b border-slate-100 pb-3 mb-4">Required skills <span className="text-slate-400 font-normal">(optional)</span></h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map(s => (
              <span key={s} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="text-blue-400 hover:text-danger"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={e => setSkill(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              className="input flex-1"
              placeholder="e.g. Python, React, Excel..."
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-4"><Plus className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-slate-400 mt-2">{skills.length}/12 skills</p>
        </div>

        {/* Publish options */}
        <div className="card p-5">
          <h2 className="font-semibold text-navy mb-3">Publishing</h2>
          <div className="flex gap-3">
            {['published', 'draft'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input {...register('status')} type="radio" value={s} className="accent-blue-DEFAULT" />
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {s === 'published' ? '🟢 Publish now' : '📝 Save as draft'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 py-3">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-[2] py-3">
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...</span>
              : 'Post opportunity'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
