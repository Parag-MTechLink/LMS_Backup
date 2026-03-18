import { useState, useEffect } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

const LiveClock = () => {
  const [dateTime, setDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  return (
    <motion.div 
      className="flex items-center gap-3 px-5 py-2 bg-gradient-to-r from-white/80 to-blue-50/50 backdrop-blur-xl rounded-2xl border border-primary/10 shadow-sm transition-all duration-300"
    >
      <div className="flex items-center gap-2.5 text-gray-500 border-r border-gray-200 pr-4">
        <div className="p-1.5 bg-blue-100/50 rounded-lg text-primary">
          <Calendar className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
          {formatDate(dateTime)}
        </span>
      </div>
      
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-indigo-100/50 rounded-lg text-indigo-600">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-sm tabular-nums font-bold text-gray-900 tracking-wider whitespace-nowrap">
          {formatTime(dateTime)}
        </span>
      </div>
    </motion.div>
  )
}

export default LiveClock
