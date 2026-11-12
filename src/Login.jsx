import { useEffect, useState } from "react"
import { supabase } from "./db"
import { useNavigate } from "react-router-dom"

function Login() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/taskboard")
    })
  }, [navigate])

  async function saveUser(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error

      const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, name: name.trim() })
      if (profileError) throw profileError

      navigate("/taskboard")
    }
    catch (err) {
      setError(err.message)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-box" onSubmit={saveUser}>
        <h1>Task Board</h1>
        <p className="muted">Enter your name to get started</p>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Continue"}</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}

export default Login
