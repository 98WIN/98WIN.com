import React, { useEffect, useState, useContext } from 'react'
import { AppContext } from '../App'

export default function Lobby({ onGoGame, onWallet, onAdmin, onLogout }){
  const { socket, user, API } = useContext(AppContext)
  const [round, setRound] = useState(null)
  const [points, setPoints] = useState(user.points)

  useEffect(()=>{
    socket.on('current_round', r=> setRound(r));
    socket.on('round_created', r=> setRound(r));
    socket.on('round_result', r=> setRound(r));
    socket.on('request_updated', ()=> fetchMe());
    socket.on('deposit_approved', ()=> fetchMe());
    async function fetchMe(){
      const token = localStorage.getItem('token');
      const res = await fetch(API + '/api/me', { headers: { 'Authorization': 'Bearer ' + token }});
      const j = await res.json();
      if(j.id) setPoints(j.points);
    }
    fetchMe();
    return ()=> socket.off();
  },[])

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-gray-50 to-white">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">98 <span className="text-yellow-400">WIN</span></h1>
        <div className="text-right">
          <div className="font-semibold">{user.phone}</div>
          <div className="mt-1">Points: <strong>{points}</strong></div>
        </div>
      </header>

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">WINGO 30sec</h3>
            <p className="text-sm text-gray-500">Realtime rounds</p>
          </div>
          <div>
            <button onClick={onGoGame} className="bg-blue-600 text-white px-4 py-2 rounded">OPEN</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="bg-green-500 text-white p-3 rounded" onClick={onWallet}>Wallet</button>
        <button className="bg-gray-200 p-3 rounded" onClick={()=> alert('History coming')}>History</button>
        <button className="bg-yellow-500 p-3 rounded" onClick={onLogout}>Logout</button>
      </div>

      <div className="mt-6">
        <h3 className="font-bold">Live Round</h3>
        {round ? (
          <div className="mt-2 p-3 bg-white rounded shadow">
            <div>Round ID: {round.id}</div>
            <div>Result: {round.result || 'Pending'}</div>
          </div>
        ) : <div>Loading...</div>}
      </div>

      <div className="mt-6">
        <button className="w-full bg-indigo-600 text-white p-3 rounded" onClick={onAdmin}>Admin Panel</button>
      </div>
    </div>
  )
}
