import React from 'react'

export default function Welcome({ onNext }){
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-5xl font-extrabold">98 <span className="text-yellow-300">WIN</span></h1>
        <p className="mt-3 text-lg">Welcome to 98 WIN — Premium</p>
        <div className="mt-6">
          <button onClick={onNext} className="px-6 py-3 rounded bg-yellow-400 text-black font-bold">Enter</button>
        </div>
        <div className="mt-6">
          <img src="/assets/ai-lady.png" alt="ai" className="mx-auto rounded" />
        </div>
      </div>
    </div>
  )
}
