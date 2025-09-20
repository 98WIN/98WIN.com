import React, { useState } from 'react'

const API = 'http://localhost:4000'

export default function Login({ onLogin }){
  const [phone,setPhone] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState('')

  async function submit(){
    const res = await fetch(API + '/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, password }) });
    const j = await res.json();
    if(!res.ok){ setErr(j.error || 'Login failed'); return; }
    localStorage.setItem('token', j.token);
    onLogin(j.user);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input className="w-full p-3 border rounded mb-2" placeholder="+91 phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="w-full p-3 border rounded mb-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white p-3 rounded" onClick={submit}>LOGIN</button>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    </div>
  )
}
