'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  ChartBarIcon,
  PlayIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const stats = [
  { name: 'Active Patients', value: '147', icon: UsersIcon, color: 'text-blue-600' },
  { name: 'Sessions Today', value: '12', icon: MicrophoneIcon, color: 'text-green-600' },
  { name: 'SOAP Notes', value: '89', icon: DocumentTextIcon, color: 'text-purple-600' },
  { name: 'Accuracy Rate', value: '98.5%', icon: ChartBarIcon, color: 'text-orange-600' },
]

const recentSessions = [
  { id: 1, patient: 'John Smith', date: '2025-10-28', duration: '15 min', status: 'Completed' },
  { id: 2, patient: 'Sarah Johnson', date: '2025-10-28', duration: '22 min', status: 'SOAP Generated' },
  { id: 3, patient: 'Michael Brown', date: '2025-10-27', duration: '18 min', status: 'Under Review' },
  { id: 4, patient: 'Emily Davis', date: '2025-10-27', duration: '25 min', status: 'Completed' },
]

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MicrophoneIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">AI Medical Scribe</h1>
                <p className="text-sm text-gray-500">Ambient Medical Documentation System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-lg font-medium text-gray-900">{currentTime}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Medical Assistant</h2>
          <p className="text-lg text-gray-600">Start transcribing, manage patients, and generate SOAP notes with AI assistance.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/transcription" className="block">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Start New Session</h3>
                    <p className="text-blue-100">Begin ambient recording and transcription</p>
                  </div>
                  <PlayIcon className="h-8 w-8 text-blue-200" />
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link href="/patients" className="block">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Manage Patients</h3>
                    <p className="text-green-100">View and manage patient records</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-green-200" />
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/notes" className="block">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">SOAP Notes</h3>
                    <p className="text-purple-100">Review and manage generated notes</p>
                  </div>
                  <DocumentDuplicateIcon className="h-8 w-8 text-purple-200" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white shadow-lg rounded-xl border border-gray-200"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSessions.map((session) => (
              <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {session.patient.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{session.patient}</p>
                      <p className="text-sm text-gray-500">{session.date} • {session.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'Completed' 
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'SOAP Generated'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                    <Link href="/notes" className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 bg-white shadow-lg rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Speech Recognition', status: 'online' },
              { name: 'Google Gemini AI', status: 'online' },
              { name: 'Database', status: 'online' },
              { name: 'WebSocket Server', status: 'online' },
            ].map((service) => (
              <div key={service.name} className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  service.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm text-gray-600">{service.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}