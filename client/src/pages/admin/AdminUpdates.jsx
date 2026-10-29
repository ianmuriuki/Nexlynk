import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Icon from '@/components/Icon'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { announcementsAPI } from '@/api/announcements'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const KINDS = [
  { value: 'update',   label: 'Weekly update' },
  { value: 'event',    label: 'Event' },
  { value: 'training', label: 'Training' },
]
const KIND_LABEL = { update: 'Update', event: 'Event', training: 'Training' }
const KIND_STYLE = {
  update:   'bg-brand-soft text-brand-ink',
  event:    'bg-info-light text-info-dark',
  training: 'bg-success-light text-success-dark',
}

const EMPTY = {
  kind: 'update', title: '', summary: '', body: '',
  event_date: '', location: '', link_url: '', link_label: '', status: 'published',
}

const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-2 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-4">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function validate(f) {
  const e = {}
  const title = f.title.trim()
  if (title.length < 3) e.title = 'Title must be at least 3 characters'
  if (title.length > 150) e.title = 'Title must be 150 characters or fewer'
  if (f.summary.trim().length > 300) e.summary = 'Summary must be 300 characters or fewer'
  if (f.body.trim().length > 8000) e.body = 'Details must be 8000 characters or fewer'
  if (!f.summary.trim() && !f.body.trim()) e.body = 'Add a summary or the full details'
  if (f.location.trim().length > 150) e.location = 'Location must be 150 characters or fewer'
  if (f.link_url.trim() && !/^https?:\/\//i.test(f.link_url.trim())) e.link_url = 'The link must start with http:// or https://'
  if (f.link_label.trim().length > 40) e.link_label = 'Button text must be 40 characters or fewer'
  return e
}

const toPayload = (f) => ({
  kind: f.kind,
  title: f.title.trim(),
  summary: f.summary.trim() || null,
  body: f.body.trim() || null,
  event_date: f.event_date || null,
  location: f.location.trim() || null,
  link_url: f.link_url.trim() || null,
  link_label: f.link_label.trim() || null,
  status: f.status,
})

export default function AdminUpdates() {
  const qc = useQueryClient()
  const formRef = useRef(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => announcementsAPI.list().then((r) => r.data.data),
  })
  const posts = data ?? []

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
    qc.invalidateQueries({ queryKey: ['announcements-public'] }),
  ])

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? announcementsAPI.update(editingId, payload) : announcementsAPI.create(payload)),
    onSuccess: async () => {
      toast.success(editingId ? 'Post updated' : 'Post saved')
      await refresh()
      closeForm()
    },
    onError: (e) => toast.error(e?.message || 'Could not save the post'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => announcementsAPI.update(id, { status }),
    onSuccess: async (_, vars) => {
      toast.success(vars.status === 'published' ? 'Post published' : 'Post moved to drafts')
      await refresh()
    },
    onError: (e) => toast.error(e?.message || 'Could not change the status'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => announcementsAPI.remove(id),
    onSuccess: async () => {
      toast.success('Post deleted')
      await refresh()
      setToDelete(null)
    },
    onError: (e) => { toast.error(e?.message || 'Could not delete the post'); setToDelete(null) },
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openNew = () => {
    setForm(EMPTY); setErrors({}); setEditingId(null); setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const openEdit = (p) => {
    setForm({
      kind: p.kind || 'update',
      title: p.title || '',
      summary: p.summary || '',
      body: p.body || '',
      event_date: p.event_date ? String(p.event_date).slice(0, 10) : '',
      location: p.location || '',
      link_url: p.link_url || '',
      link_label: p.link_label || '',
      status: p.status || 'draft',
    })
    setErrors({}); setEditingId(p.id); setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function closeForm() {
    setShowForm(false); setEditingId(null); setForm(EMPTY); setErrors({})
  }

  const submit = (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    saveMutation.mutate(toPayload(form))
  }

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete this post?"
        description={toDelete ? `"${toDelete.title}" will be removed from the platform for good.` : ''}
        confirmLabel="Delete post"
        variant="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />

      <div className="mb-7 flex flex-wrap items-start justify-between gap-3 animate-fade-up">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-ink">Updates and events</h1>
          <p className="text-ink-3 text-sm mt-1">
            Share news, events and training with students on the landing page and their dashboard.
          </p>
        </div>
        {!showForm && (
          <button type="button" onClick={openNew} className="btn-primary text-sm whitespace-nowrap">
            <Icon name="plus" size={16} /> New post
          </button>
        )}
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={submit} noValidate className="card p-5 sm:p-6 space-y-4 mb-7 scroll-mt-6">
          <h2 className="font-semibold text-ink border-b border-line pb-3">
            {editingId ? 'Edit post' : 'New post'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.kind} onChange={set('kind')} className="input">
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </Field>
            <Field label="Event date" hint="Optional. Leave empty for a general update.">
              <input type="date" value={form.event_date} onChange={set('event_date')} className="input" />
            </Field>
          </div>

          <Field label="Title" error={errors.title}>
            <input value={form.title} onChange={set('title')} maxLength={150}
              className={clsx('input', errors.title && 'input-error')} placeholder="e.g. Nexlynk Weekly Update" />
          </Field>

          <Field label="Short summary" error={errors.summary} hint={`${form.summary.length}/300. Shown on the card.`}>
            <textarea value={form.summary} onChange={set('summary')} rows={3} maxLength={300}
              className={clsx('input resize-none', errors.summary && 'input-error')}
              placeholder="One or two sentences that tell people what this is about." />
          </Field>

          <Field label="Full details" error={errors.body} hint={`${form.body.length}/8000. Line breaks are kept, so you can paste the whole update.`}>
            <textarea value={form.body} onChange={set('body')} rows={10} maxLength={8000}
              className={clsx('input resize-y', errors.body && 'input-error')}
              placeholder="Paste or write the full update here." />
          </Field>

          <Field label="Location" error={errors.location}>
            <input value={form.location} onChange={set('location')} maxLength={150} className="input" placeholder="e.g. Online, or a venue" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Link" error={errors.link_url} hint="Optional. Where people go to register or read more.">
              <input value={form.link_url} onChange={set('link_url')} className={clsx('input', errors.link_url && 'input-error')} placeholder="https://" inputMode="url" />
            </Field>
            <Field label="Button text" error={errors.link_label}>
              <input value={form.link_label} onChange={set('link_label')} maxLength={40} className="input" placeholder="e.g. Register here" />
            </Field>
          </div>

          <div>
            <p className="block text-sm font-semibold text-ink-2 mb-2">Publishing</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
              {[
                { val: 'published', label: 'Publish now', desc: 'Visible to everyone straight away' },
                { val: 'draft',     label: 'Save as draft', desc: 'Only admins can see it' },
              ].map(({ val, label, desc }) => (
                <label key={val} className="flex items-start gap-3 cursor-pointer flex-1 bg-canvas border border-line-2 rounded-xl p-3.5 hover:border-brand transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft/40">
                  <input type="radio" name="status" value={val} checked={form.status === val}
                    onChange={set('status')} className="accent-brand mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-ink-2">{label}</p>
                    <p className="text-xs text-ink-4 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1 py-3" disabled={saveMutation.isPending}>
              Cancel
            </button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-[2] py-3">
              {saveMutation.isPending ? 'Saving...' : editingId ? 'Save changes' : 'Save post'}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-line">
          <h2 className="font-semibold text-ink">All posts</h2>
          <p className="text-xs text-ink-4 mt-0.5">
            {isPending ? 'Loading posts' : isError ? 'Posts could not be loaded' : `${posts.length} post${posts.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {isPending ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-canvas-2 rounded-xl animate-shimmer" />)}
          </div>
        ) : isError ? (
          <div role="alert" className="px-6 py-12 text-center">
            <Icon name="alert-circle" size={28} className="mx-auto mb-2 text-warning" />
            <p className="text-sm font-semibold text-ink-2">Could not load posts</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Icon name="zap" size={36} className="mx-auto mb-3 text-line-2" />
            <p className="text-ink-4 text-sm">No posts yet.</p>
            {!showForm && <button type="button" onClick={openNew} className="btn-primary btn-sm mt-3 inline-flex">Write your first post</button>}
          </div>
        ) : (
          <div className="divide-y divide-line">
            {posts.map((p) => {
              const live = p.status === 'published'
              return (
                <div key={p.id} className="px-5 sm:px-6 py-4 flex flex-wrap items-center gap-3 sm:gap-4 hover:bg-canvas/80 transition-colors">
                  <div className="min-w-0 flex-1 basis-60">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={clsx('badge text-[10px]', KIND_STYLE[p.kind] || KIND_STYLE.update)}>{KIND_LABEL[p.kind] || 'Update'}</span>
                      <span className={clsx('badge text-[10px]', live ? 'bg-success-light text-success-dark' : 'bg-canvas-2 text-ink-3')}>
                        {live ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-ink break-words">{p.title}</p>
                    <p className="text-xs text-ink-4 mt-0.5">
                      {live && p.published_at ? `Published ${shortDate(p.published_at)}` : `Created ${shortDate(p.created_at)}`}
                      {p.event_date ? ` · Event on ${shortDate(p.event_date)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => openEdit(p)} className="btn btn-sm bg-canvas-2 text-ink-2 hover:bg-canvas-2 flex items-center gap-1">
                      <Icon name="edit" size={14} /> Edit
                    </button>
                    <button type="button" disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: p.id, status: live ? 'draft' : 'published' })}
                      className={clsx('btn btn-sm', live ? 'bg-canvas-2 text-ink-3 hover:bg-canvas-2' : 'bg-success-light text-success-dark hover:bg-success hover:text-white transition-all')}>
                      {live ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" onClick={() => setToDelete(p)}
                      className="btn btn-sm bg-danger-light text-danger hover:bg-danger hover:text-white transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
