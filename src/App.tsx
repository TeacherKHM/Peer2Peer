import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth'
import SubmitAssignment from './pages/student/SubmitAssignment'
import ViewSubmission from './pages/student/ViewSubmission'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/DashboardPage'
import CreateAssignment from './pages/teacher/CreateAssignment'
import RubricTemplates from './pages/teacher/RubricTemplates'
import CreateRubric from './pages/teacher/CreateRubric'

import AssignmentDetails from './pages/teacher/AssignmentDetails'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/assignments/new" element={<CreateAssignment />} />
          <Route path="/teacher/assignments/:id" element={<AssignmentDetails />} />
          <Route path="/teacher/rubrics" element={<RubricTemplates />} />
          <Route path="/teacher/rubrics/new" element={<CreateRubric />} />
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/assignments/:id/submit" element={<SubmitAssignment />} />
          <Route path="/student/assignments/:id/view" element={<ViewSubmission />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
