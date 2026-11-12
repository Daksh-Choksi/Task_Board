import { useState } from "react"
import { supabase } from "./db"
import { useNavigate } from "react-router-dom"

function Login() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  // TODO - Find out a way to actually stop showing the login screen if a user has logged in previously.

  async function saveUser(e) {
    e.preventDefault()

    const {data, error} = await supabase.auth.signInAnonymously()
    if (error) {
      throw error
    }
    try {
      const {err} = await supabase.from("profiles").insert({"id": data.id, "name": name})
      if (err) throw err
    }
    catch (err) {
      setError(err)
    }
    finally {
      localStorage.setItem("name", JSON.stringify(name))
      navigate("/taskboard")
    }
  }

  return (
    <div>
      <form onSubmit={saveUser}>
        <input type="text" placeholder="Full Name" onChange={(e) => setName(e.target.value)}></input>
        <button type="submit">Done</button>
      </form>
      {
        error == ""
        ?
        <></>
        :
        <div>{error}</div>
      }
    </div>
  )
}

export default Login