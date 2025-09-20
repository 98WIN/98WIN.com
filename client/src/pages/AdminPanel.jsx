import React, { useEffect, useState, useContext } from 'react'
import { AppContext } from '../App'

export default function AdminPanel({ onBack }){
  const { API, socket } = useContext(AppContext)
  const [token,setToken] = useState(localStorage.getItem('token') || '')
  const [requests,setRequests] = useState([])
  const [users,setUsers] = useState([])

  useEffect(()=>{
    fetchData();
    socket.on('request_created', r=> fetchData());
    socket.on('request_updated', r=> fetchData());
    return ()=> socket.off();
  },[])

  async function fetchData(){
    const t = localStorage.getItem('token');
    if(!t) return;
    setToken(t);
    const r1 = await fetch(API + '/api/admin/requests', { headers: { 'Authorization': 'Bearer ' + t }});
    const jr = await r1.json();
    if(r1.ok) setRequests(jr);
    const r2 = await fetch(API + '/api/admin/users', { headers: { 'Authorization': 'Bearer ' + t }});
    const ju = await r2.json();
    if(r2.ok) setUsers(ju);
  }

  async function act(id, action){
    const t = localStorage.getItem('token');
    const res = await fetch(API + '/api/admin/approve', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer ' + t }, body: JSON.stringify({ id, action }) });
    const j = await res.json();
    if(res.ok) fetchData();
    else alert(j.error || 'Error');
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mb-4 flex items-center">
        <button onClick={onBack} className="mr-4">Back</button>
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <div className="bg-white p-3 rounded shadow mb-4">
        <h3 className="font-semibold">Pending Requests</h3>
        {requests.length === 0 && <div className="text-sm text-gray-500 mt-2">No requests</div>}
        {requests.map(r=>(
          <div key={r.id} className="p-2 border rounded mt-2">
            <div>Type: {r.type} | Amount: {r.amount} | Status: {r.status}</div>
            <div className="mt-2">
              {r.status === 'pending' && <>
                <button className="mr-2 bg-green-600 text-white px-2 py-1 rounded" onClick={()=>act(r.id,'approve')}>Approve</button>
                <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>act(r.id,'deny')}>Deny</button>
              </>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold">Users</h3>
        {users.map(u=>(
          <div key={u.id} className="p-2 border rounded mt-2">
            <div>{u.phone} • Points: {u.points} • Role: {u.role}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
