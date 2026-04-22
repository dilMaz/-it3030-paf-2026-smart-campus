import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-12 px-4">
      <div className="max-w-3xl w-full text-center mt-8">
        <h1 className="text-5xl font-extrabold mb-4 font-display text-slate-900">Manage Your Campus Smarter</h1>
        <p className="text-lg text-slate-600 mb-8">
          One place to handle resources, bookings, tickets, notifications, and more for students, lecturers, and administrators.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/resources"
            className="flex-1 py-3 px-8 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white font-semibold shadow-lg hover:from-slate-800 hover:to-slate-600 transition text-lg"
          >
            Manage Resources
          </Link>
          <Link
            to="/bookings"
            className="flex-1 py-3 px-8 rounded-xl bg-slate-100 text-slate-900 font-semibold shadow hover:bg-slate-200 transition text-lg"
          >
            View Bookings
          </Link>
        </div>
      </div>

      <div className="max-w-5xl w-full mt-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">About Us</h2>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
          Smart University Management is built to simplify university operations and improve communication between all campus users.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2 text-slate-900">Resource Tracking</h3>
            <p className="text-slate-600 text-center">Track and manage equipment, rooms, and learning resources in one dashboard.</p>
          </div>
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2 text-slate-900">Booking Workflows</h3>
            <p className="text-slate-600 text-center">Handle booking requests with clear status updates and better visibility.</p>
          </div>
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col items-center">
            <h3 className="font-bold text-lg mb-2 text-slate-900">Support Tickets</h3>
            <p className="text-slate-600 text-center">Resolve issues faster with centralized ticket management for campus users.</p>
          </div>
        </div>
      </div>
    </div>
  )
}