import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, Briefcase, Clock, Users, CheckCircle,
  AlertTriangle, Upload, Building2
} from 'lucide-react'
import { opportunityAPI, studentAPI } from '@/api/client'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TYPE_STYLE = {
  internship:  'bg-blue-100 text-blue-700',
  'part-time': 'bg-purple-100 text-purple-700',
  contract:    'bg-warning-light text-warning-dark',
  'full-time': 'bg-success-light text-success-dark',
}

export default function ApplyModal({ opportunity, onClose, onSuccess }) {
  const { user }  = useAuthStore()
  const qc        = useQueryClient()
  const fileRef   = useRef()
  const [coverLetter, setCoverLetter] = useState('')
  const [cvUploading, setCvUploading] = useState(false)

  // Track view when modal opens
  useEffect(() => {
    if (opportunity?.id) {
      opportunityAPI.trackView(opportunity.id).catch(() => {})
    }
  }, [opportunity?.id])

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn:  () => studentAPI.getProfile(user.id).then(r => r.data.data ?? r.data),
    enabled:  !!user?.id,
  })

  const hasCV = !!profile?.cv_path

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { toast.error('Only PDF files accepted'); return }
    if (file.size > 5 * 1024 * 1024)    { toast.error('File must be under 5MB'); return }
    setCvUploading(true)
    try {
      await studentAPI.uploadCV(user.id, file)
      toast.success('CV uploaded!')
      await refetchProfile()
      qc.invalidateQueries(['student-profile', user?.id])
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setCvUploading(false)
      e.target.value = ''
    }
  }

  const applyMutation = useMutation({
    mutationFn: () => opportunityAPI.apply(opportunity.id, { cover_letter: coverLetter }),
    onSuccess: () => {
      toast.success('Application submitted successfully!')
      qc.invalidateQueries(['student-applications', user?.id])
      onSuccess?.()
      onClose()
    },
    onError: (e) => {
      if (e.status === 409) toast.error('You have already applied to this opportunity.')
      else toast.error(e?.message || 'Could not submit application')
    },
  })

  const deadline    = opportunity.application_deadline
    ? new Date(opportunity.application_deadline).toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' })
    : null
  const skills      = opportunity.skills_required ?? []
  const disciplines = opportunity.disciplines ?? []

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.95, y: 20  }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between z-10">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {opportunity.type === 'internship' ? '💼' :
                 opportunity.type === 'part-time'  ? '⏰' :
                 opportunity.type === 'contract'   ? '📝' : '🎯'}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-navy text-lg leading-tight truncate">{opportunity.title}</h2>
                <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />{opportunity.company_name}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="ml-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Quick facts */}
            <div className="flex flex-wrap gap-3">
              {opportunity.type && (
                <span className={clsx('badge capitalize', TYPE_STYLE[opportunity.type] || 'bg-slate-100 text-slate-500')}>
                  {opportunity.type}
                </span>
              )}
              {opportunity.location && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {opportunity.location}
                </span>
              )}
              {opportunity.stipend && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Briefcase className="w-3.5 h-3.5" /> {opportunity.stipend}
                </span>
              )}
              {opportunity.positions && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" /> {opportunity.positions} position{opportunity.positions > 1 ? 's' : ''}
                </span>
              )}
              {opportunity.duration && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" /> {opportunity.duration}
                </span>
              )}
              {deadline && (
                <span className="text-xs text-danger font-semibold">Closes {deadline}</span>
              )}
            </div>

            {/* Description */}
            {opportunity.description && (
              <div>
                <h3 className="text-sm font-bold text-navy mb-2">About the role</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{opportunity.description}</p>
              </div>
            )}

            {/* Disciplines */}
            {disciplines.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-navy mb-2">Target disciplines</h3>
                <div className="flex flex-wrap gap-2">
                  {disciplines.map(d => (
                    <span key={d} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Required skills */}
            {skills.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-navy mb-2">Required skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* CV section */}
            <div className={clsx('rounded-xl p-4 border', hasCV ? 'bg-success-light border-success/20' : 'bg-warning-light border-warning/30')}>
              <div className="flex items-start gap-3">
                {hasCV
                  ? <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  {hasCV ? (
                    <>
                      <p className="text-sm font-semibold text-success-dark">CV attached ✓</p>
                      <p className="text-xs text-success-dark/70 mt-0.5">Your CV will be included with this application.</p>
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="mt-2 text-xs font-semibold text-success-dark underline hover:no-underline">
                        Replace CV
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-warning-dark">No CV uploaded</p>
                      <p className="text-xs text-warning-dark/70 mt-0.5">Upload your CV — companies need it to review your application.</p>
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={cvUploading}
                        className="mt-2 flex items-center gap-1.5 text-xs font-bold text-warning-dark bg-white border border-warning/40 rounded-lg px-3 py-1.5 hover:bg-warning/10 transition-colors">
                        {cvUploading
                          ? <><span className="w-3 h-3 border-2 border-warning/30 border-t-warning rounded-full animate-spin" /> Uploading...</>
                          : <><Upload className="w-3.5 h-3.5" /> Upload CV (PDF, max 5MB)</>
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleCVUpload} />
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-sm font-bold text-navy mb-1.5">
                Cover Letter <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={4}
                maxLength={1000}
                className="input resize-none"
                placeholder="Briefly explain why you're a good fit for this role..."
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{coverLetter.length}/1000</p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
            <button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || cvUploading}
              className={clsx(
                'flex-[2] py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                !hasCV ? 'bg-warning text-white hover:bg-yellow-600' : 'btn-primary'
              )}
            >
              {applyMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                : !hasCV ? 'Apply without CV' : 'Submit application →'
              }
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}