import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import Welcome from './pages/Welcome'
import Register from './pages/Register'
import Login from './pages/Login'
import Lobby from './pages/Lobby'
import Game from './pages/Game'
import Wallet from './pages/Wallet'
import AdminPanel from './pages/AdminPanel'

const API = 'http://localhost:4000'
const socket = io(API)

export const AppContext = React.createContext()

export default function App(){
  const [page,setPage] = useState('welcome')
  const [user,setUser] = useState(null)

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if(token){
      fetch(API + '/api/me', { headers: { 'Authorization': 'Bearer ' + token }}).then(r=>r.json()).then(j=>{
        if(j.id) setUser(j)
      });
    }
    // auto redirect from welcome after 1.2s
    if(page === 'welcome'){
      const t = setTimeout(()=> setPage('register'), 1200);
      return ()=> clearTimeout(t);
    }
  },[page]);

  function handleRegistered(){ setPage('login') }
  function handleLogin(u){ setUser(u); setPage('lobby') }
  function logout(){ localStorage.removeItem('token'); setUser(null); setPage('welcome') }

  const ctx = { API, socket, user, setUser }

  if(page === 'welcome') return <Welcome onNext={()=>setPage('register')} />
  if(page === 'register') return <Register onRegistered={handleRegistered} />
  if(page === 'login') return <Login onLogin={handleLogin} />
  if(page === 'lobby' && user) return <AppContext.Provider value={ctx}><Lobby onGoGame={()=>setPage('game')} onWallet={()=>setPage('wallet')} onAdmin={()=>setPage('admin')} onLogout={logout} /></AppContext.Provider>
  if(page === 'game') return <AppContext.Provider value={ctx}><Game onBack={()=>setPage('lobby')} /></AppContext.Provider>
  if(page === 'wallet') return <AppContext.Provider value={ctx}><Wallet onBack={()=>setPage('lobby')} /></AppContext.Provider>
  if(page === 'admin') return <AppContext.Provider value={ctx}><AdminPanel onBack={()=>setPage('lobby')} /></AppContext.Provider>

  return <div>Loading...</div>
}
