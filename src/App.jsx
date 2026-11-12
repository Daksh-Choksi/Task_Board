import Login from './Login'
import TaskBoard from './TaskBoard'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}></Route>
        <Route path='/taskboard' element={<TaskBoard />}></Route>
      </Routes> 
    </BrowserRouter>
  )
}

export default App
