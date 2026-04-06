import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const stats = [
  { icon: "🏛️", label: "Total Facilities", value: "24", color: "#667eea" },
  { icon: "📅", label: "Active Bookings", value: "12", color: "#f093fb" },
  { icon: "🔧", label: "Open Tickets", value: "8", color: "#f5576c" },
  { icon: "🔔", label: "Notifications", value: "5", color: "#4facfe" },
]

const recentBookings = [
  { id: 1, room: "Lecture Hall A", date: "2026-04-06", time: "09:00 - 11:00", status: "APPROVED" },
  { id: 2, room: "Lab 3", date: "2026-04-07", time: "13:00 - 15:00", status: "PENDING" },
  { id: 3, room: "Meeting Room 2", date: "2026-04-08", time: "10:00 - 12:00", status: "REJECTED" },
]

const recentTickets = [
  { id: 1, title: "Projector not working", location: "Hall B", priority: "HIGH", status: "OPEN" },
  { id: 2, title: "AC malfunction", location: "Lab 1", priority: "MEDIUM", status: "IN_PROGRESS" },
  { id: 3, title: "Door lock broken", location: "Room 204", priority: "LOW", status: "RESOLVED" },
]

const statusColor = {
  APPROVED: { bg: "#e6f4ea", color: "#2d7a3a" },
  PENDING: { bg: "#fff8e1", color: "#f9a825" },
  REJECTED: { bg: "#fce8e6", color: "#c62828" },
  OPEN: { bg: "#fce8e6", color: "#c62828" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#1a73e8" },
  RESOLVED: { bg: "#e6f4ea", color: "#2d7a3a" },
  HIGH: { bg: "#fce8e6", color: "#c62828" },
  MEDIUM: { bg: "#fff8e1", color: "#f9a825" },
  LOW: { bg: "#e6f4ea", color: "#2d7a3a" },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartCampusUser") || "null")
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (currentUser) {
      return
    }

    axios.get('http://localhost:8080/api/auth/me', { withCredentials: true })
      .then(res => {
        setCurrentUser(res.data)
        localStorage.setItem('smartCampusUser', JSON.stringify(res.data))
      })
      .catch(() => {
        navigate('/')
      })
  }, [currentUser, navigate])

  const displayName = currentUser?.name || currentUser?.email || "User"
  const displayEmail = currentUser?.email || ""
  const displayInitial = displayName.charAt(0).toUpperCase()

  const menuItems = [
    { icon: "🏠", label: "Dashboard", active: true },
    { icon: "🏛️", label: "Facilities" },
    { icon: "📅", label: "Bookings" },
    { icon: "🔧", label: "Tickets" },
    { icon: "🔔", label: "Notifications", action: () => navigate("/notifications") },
    { icon: "👤", label: "Profile" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Segoe UI, sans-serif", background: "#f0f2f5" }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "240px" : "70px",
        background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
        transition: "width 0.3s",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        boxShadow: "4px 0 15px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "0 20px 25px", borderBottom: "1px solid rgba(255,255,255,0.2)"
        }}>
          <span style={{ fontSize: "28px" }}>🎓</span>
          {sidebarOpen && (
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>Smart Campus</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>Operations Hub</div>
            </div>
          )}
        </div>

        <nav style={{ marginTop: "20px", flex: 1 }}>
          {menuItems.map((item, i) => (
            <div
              key={i}
              onClick={item.action}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "13px 20px", cursor: "pointer",
                background: item.active ? "rgba(255,255,255,0.2)" : "transparent",
                borderLeft: item.active ? "4px solid white" : "4px solid transparent",
                transition: "all 0.2s",
                color: "white"
              }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {sidebarOpen && (
                <span style={{ fontSize: "14px", fontWeight: item.active ? "600" : "400" }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "13px 20px", cursor: "pointer", color: "rgba(255,255,255,0.8)"
          }}>
          <span style={{ fontSize: "20px" }}>🚪</span>
          {sidebarOpen && <span style={{ fontSize: "14px" }}>Logout</span>}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <div style={{
          background: "white", padding: "15px 25px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none", border: "none", fontSize: "20px",
                cursor: "pointer", color: "#667eea"
              }}>
              ☰
            </button>
            <h2 style={{ margin: 0, color: "#333", fontSize: "20px" }}>Dashboard</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div
              onClick={() => navigate("/notifications")}
              style={{
                position: "relative", cursor: "pointer",
                background: "#f0f2f5", borderRadius: "50%",
                width: "40px", height: "40px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px"
              }}>
              🔔
              <span style={{
                position: "absolute", top: "-2px", right: "-2px",
                background: "#f5576c", color: "white",
                borderRadius: "50%", width: "16px", height: "16px",
                fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center"
              }}>5</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "#f0f2f5", borderRadius: "25px", padding: "8px 15px"
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "700", fontSize: "14px"
              }}>{displayInitial}</div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <span style={{ color: "#333", fontWeight: "600", fontSize: "14px" }}>{displayName}</span>
                {displayEmail && (
                  <span style={{ color: "#888", fontSize: "12px" }}>{displayEmail}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "25px", flex: 1 }}>

          {/* Welcome */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "15px", padding: "25px 30px",
            marginBottom: "25px", color: "white"
          }}>
            <h2 style={{ margin: "0 0 5px" }}>👋 Welcome back, {displayName}!</h2>
            <p style={{ margin: 0, opacity: 0.85, fontSize: "14px" }}>
              Here's what's happening at Smart Campus today.
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px", marginBottom: "25px"
          }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                background: "white", borderRadius: "15px",
                padding: "20px", boxShadow: "0 2px 15px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: "15px"
              }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "12px",
                  background: stat.color + "20",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px"
                }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#333" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tables */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* Recent Bookings */}
            <div style={{
              background: "white", borderRadius: "15px",
              padding: "20px", boxShadow: "0 2px 15px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ margin: "0 0 20px", color: "#333", fontSize: "16px" }}>
                📅 Recent Bookings
              </h3>
              {recentBookings.map(b => (
                <div key={b.id} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "12px 0",
                  borderBottom: "1px solid #f0f2f5"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#333", fontSize: "14px" }}>{b.room}</div>
                    <div style={{ color: "#888", fontSize: "12px" }}>{b.date} • {b.time}</div>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                    background: statusColor[b.status].bg, color: statusColor[b.status].color
                  }}>{b.status}</span>
                </div>
              ))}
            </div>

            {/* Recent Tickets */}
            <div style={{
              background: "white", borderRadius: "15px",
              padding: "20px", boxShadow: "0 2px 15px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ margin: "0 0 20px", color: "#333", fontSize: "16px" }}>
                🔧 Recent Tickets
              </h3>
              {recentTickets.map(t => (
                <div key={t.id} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "12px 0",
                  borderBottom: "1px solid #f0f2f5"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#333", fontSize: "14px" }}>{t.title}</div>
                    <div style={{ color: "#888", fontSize: "12px" }}>
                      📍 {t.location} •{" "}
                      <span style={{
                        color: statusColor[t.priority].color,
                        fontWeight: "600"
                      }}>{t.priority}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                    background: statusColor[t.status].bg, color: statusColor[t.status].color
                  }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}