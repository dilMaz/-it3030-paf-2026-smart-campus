import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const currentUserId = (() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('smartCampusUser') || 'null')
      return currentUser?.id || null
    } catch {
      return null
    }
  })()

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    axios.get(`http://localhost:8080/api/notifications/${currentUserId}`)
      .then(res => setNotifications(res.data))
      .catch(() => setError('Unable to load notifications right now.'))
  }, [currentUserId])

  const message = !currentUserId ? 'Please login first to view notifications.' : error

  const markAsRead = (id) => {
    axios.patch(`http://localhost:8080/api/notifications/${id}/read`)
      .then(() => {
        setNotifications(current => current.map(notification => (
          notification.id === id ? { ...notification, read: true } : notification
        )))
      })
  }

  const deleteNotification = (id) => {
    axios.delete(`http://localhost:8080/api/notifications/${id}`)
      .then(() => {
        setNotifications(current => current.filter(notification => notification.id !== id))
      })
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: '#1a73e8' }}>🔔 Notifications</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
          ← Back
        </button>
      </div>

      {message && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          color: '#c62828'
        }}>
          {message}
        </div>
      )}

      {notifications.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          color: '#666'
        }}>
          No notifications yet! 🎉
        </div>
      ) : (
        notifications.map(notification => (
          <div key={notification.id} style={{
            backgroundColor: notification.read ? 'white' : '#e8f0fe',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: notification.read ? 'normal' : 'bold' }}>
                {notification.message}
              </p>
              <small style={{ color: '#666' }}>{notification.type}</small>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!notification.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    backgroundColor: '#1a73e8',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}>
                  ✓ Read
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteNotification(notification.id)}
                style={{
                  backgroundColor: '#ea4335',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default NotificationsPage