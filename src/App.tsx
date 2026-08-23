import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'

// Pages & Layouts
import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'

// Patient Partition
import PatientLayout from '@/layouts/PatientLayout'
import PatientDashboard from '@/pages/patient/PatientDashboard'
import BookingFlow from '@/pages/patient/BookingFlow'
import MedicationTracker from '@/pages/patient/MedicationTracker'

// Doctor Partition
import DoctorLayout from '@/layouts/DoctorLayout'
import DoctorDashboard from '@/pages/doctor/DoctorDashboard'
import PostVisitRoom from '@/pages/doctor/PostVisitRoom'
import DoctorWorkingHours from '@/pages/doctor/DoctorWorkingHours'

// Admin Partition
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Patient Role-Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
            <Route path="/patient" element={<PatientLayout />}>
              <Route index element={<PatientDashboard />} />
              <Route path="book" element={<BookingFlow />} />
              <Route path="medications" element={<MedicationTracker />} />
            </Route>
          </Route>

          {/* Doctor Role-Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
            <Route path="/doctor" element={<DoctorLayout />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="appointment/:id" element={<PostVisitRoom />} />
              <Route path="hours" element={<DoctorWorkingHours />} />
            </Route>
          </Route>

          {/* Admin Role-Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Root Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
