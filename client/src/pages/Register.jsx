import React, { useState } from 'react'

const API = 'http://localhost:4000'

export default function Register({ onRegistered }){
  const [phone,setPhone] = useState('')
  const [password,setPassword] = useState('')
  const [confirm,setConfirm] = useState('')
  const [invite,setInvite] = useState('')
  const [agree,setAgree] = useState(false)
  const [msg,setMsg] = useState('')

  async function submit(){
    if(!phone || !password) { setMsg('Enter phone and password'); return; }
    if(password !== confirm){ setMsg('Passwords do not match'); return; }
    if(!agree){ setMsg('Please agree to terms'); return; }
    const res = await fetch(API + '/api/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, password, invitation: invite }) });
    const j = await res.json();
    if(!res.ok){ setMsg(j.error || 'Error'); return; }
    setMsg('Account created');
    onRegistered();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Register your phone</h2>
        <input className="w-full p-3 border rounded mb-2" placeholder="+91 phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="w-full p-3 border rounded mb-2" placeholder="Set password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <input className="w-full p-3 border rounded mb-2" placeholder="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        <input className="w-full p-3 border rounded mb-2" placeholder="Invite code (optional)" value={invite} onChange={e=>setInvite(e.target.value)} />
        <div className="flex items-center mb-4">
          <input type="checkbox" id="agree" className="mr-2" checked={agree} onChange={e=>setAgree(e.target.checked)} />
          <label htmlFor="agree">I have read and agree</label>
        </div>
        <button className="w-full bg-blue-600 text-white p-3 rounded" onClick={submit}>CONFIRM</button>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </div>
    </div>
  )
}
