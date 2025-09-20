import React, { useState, useContext } from 'react'
import { AppContext } from '../App'

export default function Wallet({ onBack }){
  const { API, user } = useContext(AppContext)
  const [amount,setAmount] = useState(100)
  const [utr,setUtr] = useState('')
  const [msg,setMsg] = useState('')

  async function deposit(){
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/deposit', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ amount, utr }) });
    const j = await res.json();
    if(!res.ok){ setMsg(j.error || 'Error'); return; }
    setMsg('Deposit request sent (pending admin approval)');
  }

  async function withdraw(){
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/api/withdraw', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ amount, accountNumber: 'ACCT', ifsc: 'IFSC', beneficiary: 'You' }) });
    const j = await res.json();
    if(!res.ok){ setMsg(j.error || 'Error'); return; }
    setMsg('Withdraw request created (pending)');
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mb-4">
        <button onClick={onBack}>Back</button>
      </div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="font-bold">Wallet</h3>
        <p>Balance: {user?.points}</p>
      </div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <h4 className="font-semibold">Deposit (simulate)</h4>
        <input className="w-full p-2 border rounded mb-2" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <input className="w-full p-2 border rounded mb-2" placeholder="UTR / Txn ID" value={utr} onChange={e=>setUtr(e.target.value)} />
        <button className="w-full bg-green-500 text-white p-2 rounded" onClick={deposit}>Submit Deposit</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h4 className="font-semibold">Withdraw (simulate)</h4>
        <input className="w-full p-2 border rounded mb-2" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <button className="w-full bg-red-500 text-white p-2 rounded" onClick={withdraw}>Request Withdraw</button>
      </div>

      {msg && <div className="mt-4">{msg}</div>}
    </div>
  )
}
