import { useState } from 'react'
import Login from './Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}></Route>
        <Route path='/taskboard' element></Route>
      </Routes> 
    </BrowserRouter>
  )
}

export default App
