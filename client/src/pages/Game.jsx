import React, { useEffect, useState, useContext } from 'react'
import { AppContext } from '../App'

export default function Game({ onBack }){
  const { socket, API, user } = useContext(AppContext)
  const [round, setRound] = useState(null)
  const [amount, setAmount] = useState(100)
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    socket.on('current_round', r=> setRound(r));
    socket.on('round_result', r=> {
      if(r.id === round?.id) setRound(r);
    });
    return ()=> socket.off('current_round');
  },[round, socket]);

  async function placeBet(choice){
    const token = localStorage.getItem('token');
    if(!token){ setMsg('Login first'); return; }
    if(!round) return;
    const res = await fetch(API + '/api/rounds/' + round.id + '/bet', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ choice, amount }) });
    const j = await res.json();
    if(!res.ok){ setMsg(j.error || 'Error'); return; }
    setMsg('Bet placed');
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center mb-4">
        <button className="mr-4" onClick={onBack}>Back</button>
        <h2 className="text-xl font-bold">WINGO 30s</h2>
      </div>

      {round ? (
        <div>
          <div className="bg-white p-4 rounded shadow mb-4">
            <div>Round: {round.id}</div>
            <div>Result: {round.result || 'Pending'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button className="bg-orange-400 p-3 rounded text-white" onClick={()=>placeBet('BIG')}>Big</button>
            <button className="bg-blue-400 p-3 rounded text-white" onClick={()=>placeBet('SMALL')}>Small</button>
          </div>

          <div className="mb-3">
            <input type="number" className="w-full p-2 border rounded" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
          </div>

          {msg && <div className="text-sm mb-2">{msg}</div>}
        </div>
      ) : <div>Loading round...</div>}
    </div>
  )
}
