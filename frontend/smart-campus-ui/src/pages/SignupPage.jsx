import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    localStorage.removeItem("smartCampusUser")
    window.location.href = "http://localhost:8080/oauth2/authorization/google"
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axios.post("http://localhost:8080/api/auth/register", {
        name,
        email,
        password,
        confirmPassword,
      })

      localStorage.setItem("smartCampusUser", JSON.stringify(response.data))
      navigate("/dashboard")
    } catch (registerError) {
      setError(registerError?.response?.data?.error || "Account creation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Segoe UI, sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "40px",
        width: "400px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "40px" }}>🎓</div>
          <h1 style={{ color: "#667eea", margin: "10px 0 5px", fontSize: "24px" }}>Smart Campus</h1>
          <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Operations Hub</p>
        </div>

        <h2 style={{ textAlign: "center", color: "#333", marginBottom: "25px" }}>Create Account</h2>

        <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>Full Name</label>
          <input type="text" placeholder="John Doe" value={name} onChange={(event) => setName(event.target.value)} style={{
            width: "100%", padding: "12px", border: "2px solid #eee",
            borderRadius: "10px", fontSize: "14px", marginTop: "5px",
            outline: "none", boxSizing: "border-box"
          }} />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} style={{
            width: "100%", padding: "12px", border: "2px solid #eee",
            borderRadius: "10px", fontSize: "14px", marginTop: "5px",
            outline: "none", boxSizing: "border-box"
          }} />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} style={{
            width: "100%", padding: "12px", border: "2px solid #eee",
            borderRadius: "10px", fontSize: "14px", marginTop: "5px",
            outline: "none", boxSizing: "border-box"
          }} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>Confirm Password</label>
          <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{
            width: "100%", padding: "12px", border: "2px solid #eee",
            borderRadius: "10px", fontSize: "14px", marginTop: "5px",
            outline: "none", boxSizing: "border-box"
          }} />
        </div>

        {error && (
          <div style={{ marginBottom: "12px", color: "#c62828", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "13px",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          color: "white", border: "none", borderRadius: "10px",
          fontSize: "16px", fontWeight: "600", cursor: "pointer", marginBottom: "15px",
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <div style={{ flex: 1, height: "1px", background: "#eee" }} />
          <span style={{ color: "#aaa", fontSize: "13px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#eee" }} />
        </div>

        <button type="button" onClick={handleGoogleLogin} style={{
          width: "100%", padding: "13px", background: "white", color: "#333",
          border: "2px solid #eee", borderRadius: "10px", fontSize: "15px",
          fontWeight: "600", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px"
        }}>
          <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google" />
          Continue with Google
        </button>

        <p style={{ textAlign: "center", color: "#888", fontSize: "14px", margin: 0 }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/")}
            style={{ color: "#667eea", fontWeight: "600", cursor: "pointer" }}>
            Login
          </span>
        </p>
        </form>
      </div>
    </div>
  )
}