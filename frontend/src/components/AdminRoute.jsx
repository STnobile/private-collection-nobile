import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import ProtectedRoute from './ProtectedRoute.jsx'

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth()

  return (
    <ProtectedRoute>
      {isAdmin ? children : <Navigate to="/home" replace />}
    </ProtectedRoute>
  )
}

export default AdminRoute
