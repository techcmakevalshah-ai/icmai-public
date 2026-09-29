'use client'

import { FormEvent, useState } from 'react'

type Result = {
  registration_number: string
  student_name: string
  course: 'foundation' | 'intermediate'
}

export default function Finder() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [searched, setSearched] = useState(false)
  const [copied, setCopied] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 2) return setMessage('Enter at least 2 characters.')
    setLoading(true); setSearched(true); setMessage('')
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults(data.results || [])
      setMessage(data.results?.length ? '' : 'No matching student found. Check the spelling or try the registered mobile number.')
    } catch (err) {
      setResults([])
      setMessage(err instanceof Error ? err.message : 'Search failed')
    } finally { setLoading(false) }
  }

  async function copyRegistration(registrationNumber: string) {
    await navigator.clipboard.writeText(registrationNumber)
    setCopied(registrationNumber)
    window.setTimeout(() => setCopied(''), 1400)
  }

  return (
    <main className="shell">
      <div className={`finder-layout ${searched ? 'has-branding' : ''}`}>
        <section className="finder-card">
          <div className="eyebrow">Surat ICMAI - Students Service</div>
          <h1>Find your registration number</h1>
          <p className="lead">Search using your student name, registered mobile number, or registration number.</p>
          <form onSubmit={submit} className="search-row">
            <input
              autoFocus
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="e.g. student name or mobile number"
              aria-label="Search students"
            />
            <button disabled={loading} aria-busy={loading}>{loading ? 'Searching…' : 'Search'}</button>
          </form>
          <p className="privacy-note">For privacy, only name, course and registration number are shown.</p>
          {message && <div className="message">{message}</div>}
          {results.length > 0 && (
            <div className="results" aria-live="polite">
              <div className="results-head">{results.length} match{results.length===1?'':'es'}</div>
              {results.map((item)=>(
                <article className="result-card" key={item.course+'-'+item.registration_number}>
                  <div>
                    <div className="student-name">{item.student_name}</div>
                    <div className="course">{item.course==='foundation'?'Foundation':'Intermediate'}</div>
                  </div>
                  <div className="reg-block">
                    <span>Registration No.</span>
                    <strong>{item.registration_number}</strong>
                    <button
                      type="button"
                      className="copy"
                      onClick={()=>copyRegistration(item.registration_number)}
                    >
                      {copied===item.registration_number ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {searched && (
          <aside className="branding" aria-label="CMA Keval Shah, Chairman">
            <img className="branding-photo" src="/keval-profile.svg" alt="CMA Keval Shah" />
            <div className="branding-copy">
              <em>All the Best</em>
              <strong>CMA KEVAL SHAH</strong>
              <span>Chairman</span>
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}
