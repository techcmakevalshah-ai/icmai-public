'use client'
import { FormEvent, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL='https://runblmanbuotldxelopf.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY='sb_publishable_IgnEb3GnY1EPGgX4F0EB_g_JejnA6EM'
type Course='foundation'|'intermediate'

export default function AdminPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [token,setToken]=useState('')
  const [status,setStatus]=useState('')
  const [course,setCourse]=useState<Course>('foundation')
  const [confirmWord,setConfirmWord]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [form,setForm]=useState({registration_number:'',student_name:'',mobile:''})

  async function login(e:FormEvent){
    e.preventDefault()
    setStatus('Signing in…')
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL||DEFAULT_SUPABASE_URL
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||DEFAULT_SUPABASE_PUBLISHABLE_KEY
    const supabase=createClient(url,key)
    const {data,error}=await supabase.auth.signInWithPassword({email,password})
    if(error||!data.session) return setStatus(error?.message||'Login failed')
    setToken(data.session.access_token)
    setStatus('Signed in.')
  }

  async function upload(e:FormEvent){
    e.preventDefault()
    if(!file) return setStatus('Select an Excel file first.')
    if(confirmWord.trim().toLowerCase()!==course) return setStatus(`Type ${course} exactly to confirm.`)
    setStatus('Uploading…')
    const fd=new FormData()
    fd.set('file',file)
    fd.set('course',course)
    fd.set('confirmation',confirmWord)
    const res=await fetch('/api/admin/upload',{method:'POST',headers:{authorization:`Bearer ${token}`},body:fd})
    const data=await res.json()
    setStatus(res.ok?`Done. ${data.processed} records processed.`:data.error)
  }

  async function addStudent(e:FormEvent){
    e.preventDefault()
    setStatus('Saving…')
    const res=await fetch('/api/admin/add',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${token}`},
      body:JSON.stringify({...form,course})
    })
    const data=await res.json()
    setStatus(res.ok?'Student saved.':data.error)
  }

  if(!token) return <main className="admin-shell"><section className="admin-card">
    <h1>Team login</h1>
    <p>Authorized team members only.</p>
    <form onSubmit={login} className="stack">
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button>Sign in</button>
    </form>
    {status&&<p className="admin-status">{status}</p>}
  </section></main>

  return <main className="admin-shell"><section className="admin-card wide">
    <div className="admin-top"><div><h1>Add students</h1><p>Only minimum finder data is stored.</p></div><a href="/">Open Finder</a></div>
    <div className="course-picker">
      <button className={course==='foundation'?'active':''} onClick={()=>setCourse('foundation')}>Foundation</button>
      <button className={course==='intermediate'?'active':''} onClick={()=>setCourse('intermediate')}>Intermediate</button>
    </div>
    <div className="admin-grid">
      <form onSubmit={addStudent} className="panel stack">
        <h2>Manual entry</h2>
        <input placeholder="Registration Number" value={form.registration_number} onChange={e=>setForm({...form,registration_number:e.target.value})} required/>
        <input placeholder="Student Name" value={form.student_name} onChange={e=>setForm({...form,student_name:e.target.value})} required/>
        <input placeholder="Registered Mobile No" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})}/>
        <button>Save student</button>
      </form>
      <form onSubmit={upload} className="panel stack">
        <h2>Excel upload</h2>
        <p>Only S No, Registration Number, Student Name and Mobile No are stored. Extra columns in an uploaded sheet are ignored.</p>
        <a className="download" href={`/api/admin/template?course=${course}`}>Download blank Excel format</a>
        <input type="file" accept=".xlsx,.xls" onChange={e=>setFile(e.target.files?.[0]||null)} required/>
        <label>To confirm upload to <strong>{course}</strong>, type <strong>{course}</strong> below.</label>
        <input placeholder={course} value={confirmWord} onChange={e=>setConfirmWord(e.target.value)}/>
        <button>Upload Excel</button>
      </form>
    </div>
    {status&&<p className="admin-status">{status}</p>}
  </section></main>
}
