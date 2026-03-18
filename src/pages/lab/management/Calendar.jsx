import { useEffect, useState } from 'react'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Clock,
  FlaskConical,
  Play,
  ClipboardCheck,
  Shield,
  FolderKanban,
  Package,
  FileText,
  AlertCircle,
  X,
  Edit,
  Trash2,
  MapPin,
  Users,
  Save,
  MoreHorizontal
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays, startOfDay, isToday, getDay } from 'date-fns'
import { calendarService, EVENT_TYPES } from '../../../services/calendarService'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Modal from '../../../components/labManagement/Modal'

const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
}

const iconMap = {
  FlaskConical,
  Play,
  ClipboardCheck,
  Shield,
  FolderKanban,
  Package,
  FileText,
  AlertCircle,
  CalendarIcon
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#6366F1', '#EF4444', '#6B7280'
]

function Calendar() {
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState(VIEW_TYPES.MONTH)
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState(Object.values(EVENT_TYPES).map(type => type.id))
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    event_type: 'custom',
    color: COLORS[0],
    location: '',
    attendees: []
  })

  useEffect(() => {
    loadEvents()
  }, [currentDate, view])

  useEffect(() => {
    filterEvents()
  }, [events, activeFilters])

  const loadEvents = async () => {
    try {
      setLoading(true)
      let startDate, endDate

      if (view === VIEW_TYPES.MONTH) {
        startDate = startOfMonth(currentDate)
        endDate = endOfMonth(currentDate)
      } else if (view === VIEW_TYPES.WEEK) {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
      } else {
        startDate = startOfDay(currentDate)
        endDate = new Date(currentDate)
        endDate.setHours(23, 59, 59, 999)
      }

      console.log('🗓️ Calendar.jsx: Loading events from', startDate, 'to', endDate)
      const fetchedEvents = await calendarService.getEvents(startDate, endDate)
      console.log('🗓️ Calendar.jsx: Fetched events:', fetchedEvents.length, fetchedEvents)
      setEvents(fetchedEvents)
      console.log('🗓️ Calendar.jsx: Events set in state')
    } catch (error) {
      toast.error('Failed to load calendar events')
      console.error('🗓️ Calendar.jsx: Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    console.log('🔍 Filtering events. Total:', events.length, 'Active filters:', activeFilters)
    const filtered = events.filter(event => {
      const included = activeFilters.includes(event.type)
      if (!included) {
        console.log('❌ Event filtered out:', event.title, 'type:', event.type)
      }
      return included
    })
    console.log('🔍 Filtered events:', filtered.length, filtered)
    setFilteredEvents(filtered)
  }

  const handlePrevious = () => {
    if (view === VIEW_TYPES.MONTH) {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === VIEW_TYPES.WEEK) {
      setCurrentDate(subDays(currentDate, 7))
    } else {
      setCurrentDate(subDays(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === VIEW_TYPES.MONTH) {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === VIEW_TYPES.WEEK) {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleFilterToggle = (filterType) => {
    setActiveFilters(prev =>
      prev.includes(filterType)
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    )
  }

  const handleDateClick = (date) => {
    if (!canCreate) return
    setSelectedDate(date)

    // Use the actual time from the clicked date
    const startTime = new Date(date)
    const endTime = new Date(date)

    // Add 1 hour for end time
    endTime.setHours(startTime.getHours() + 1, startTime.getMinutes(), 0, 0)

    setFormData({
      ...formData,
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm")
    })
    setShowCreateModal(true)
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    try {
      await calendarService.createEvent(formData)
      toast.success('Event created successfully!')
      setShowCreateModal(false)
      resetForm()
      loadEvents()
    } catch (error) {
      toast.error(error.message || 'Failed to create event')
    }
  }

  const handleEditEvent = () => {
    if (!selectedEvent || !selectedEvent.isCustom) return

    setFormData({
      title: selectedEvent.title,
      description: selectedEvent.description || '',
      start_time: format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm"),
      all_day: selectedEvent.allDay,
      event_type: selectedEvent.type,
      color: selectedEvent.color,
      location: selectedEvent.location || '',
      attendees: selectedEvent.attendees || []
    })
    setShowEventModal(false)
    setShowEditModal(true)
  }

  const handleUpdateEvent = async (e) => {
    e.preventDefault()
    try {
      await calendarService.updateEvent(selectedEvent.dbId, formData)
      toast.success('Event updated successfully!')
      setShowEditModal(false)
      setSelectedEvent(null)
      resetForm()
      loadEvents()
    } catch (error) {
      toast.error(error.message || 'Failed to update event')
    }
  }

  const handleDeleteEvent = async () => {
    if (!canCreate || !selectedEvent || !selectedEvent.isCustom) return

    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await calendarService.deleteEvent(selectedEvent.dbId)
        toast.success('Event deleted successfully!')
        setShowEventModal(false)
        setSelectedEvent(null)
        loadEvents()
      } catch (error) {
        toast.error(error.message || 'Failed to delete event')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      all_day: false,
      event_type: 'custom',
      color: COLORS[0],
      location: '',
      attendees: []
    })
  }

  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start)
      return isSameDay(eventDate, date)
    })
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Start on Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day headers - Teams style */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="p-3 text-center">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{day.slice(0, 3)}</div>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {weeks.map((week, weekIndex) => (
            week.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const isWeekend = getDay(day) === 0 || getDay(day) === 6

              return (
                <motion.div
                  key={day.toISOString()}
                  whileHover={{ backgroundColor: isCurrentMonth ? '#f9fafb' : '#fafafa' }}
                  className={`min-h-[140px] border-r border-b border-gray-200 p-2 cursor-pointer transition-colors ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                    } ${isWeekend && isCurrentMonth ? 'bg-blue-50/30' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-medium flex items-center justify-center ${isCurrentDay
                      ? 'w-7 h-7 rounded-full bg-primary text-white font-bold'
                      : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                      }`}>
                      {format(day, 'd')}
                    </div>
                    {dayEvents.length > 0 && (
                      <Badge variant="info" className="text-xs px-1.5 py-0.5">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>

                  {/* Events list - Teams style */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 4).map(event => {
                      const eventType = EVENT_TYPES[Object.keys(EVENT_TYPES).find(key => EVENT_TYPES[key].id === event.type)]
                      const Icon = iconMap[eventType?.icon] || CalendarIcon
                      const startTime = new Date(event.start)

                      return (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.02, x: 2 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                          className="group relative text-xs px-2 py-1.5 rounded cursor-pointer transition-all flex items-start gap-1.5 shadow-sm hover:shadow-md"
                          style={{
                            backgroundColor: event.color,
                            color: 'white'
                          }}
                        >
                          {/* Time indicator for non-all-day events */}
                          {!event.allDay && (
                            <div className="text-[10px] font-semibold opacity-90 whitespace-nowrap">
                              {format(startTime, 'h:mm a')}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate leading-tight">
                              {event.title}
                            </div>
                            {event.location && (
                              <div className="text-[10px] opacity-80 truncate flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                    {dayEvents.length > 4 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary font-medium px-2 py-1 hover:underline cursor-pointer"
                      >
                        +{dayEvents.length - 4} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex flex-col h-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="p-3 border-r border-gray-200">
              <div className="text-xs font-semibold text-gray-500">GMT+5:30</div>
            </div>
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center border-r border-gray-200 ${isToday(day) ? 'bg-primary/5' : ''
                    }`}
                >
                  <div className="text-xs font-semibold text-gray-500 uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${isToday(day)
                    ? 'w-10 h-10 mx-auto rounded-full bg-primary text-white flex items-center justify-center'
                    : 'text-gray-900'
                    }`}>
                    {format(day, 'd')}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-8">
              {/* Time labels */}
              <div className="border-r border-gray-200">
                {hours.map(hour => (
                  <div key={hour} className="h-20 border-b border-gray-100 p-2 text-right">
                    <span className="text-xs text-gray-500">
                      {format(new Date().setHours(hour, 0), 'h a')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map(day => {
                const dayEvents = getEventsForDate(day).filter(e => !e.allDay)
                return (
                  <div key={day.toISOString()} className="border-r border-gray-200 relative">
                    {hours.map(hour => (
                      <div
                        key={hour}
                        className="h-20 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          const clickedDate = new Date(day)
                          clickedDate.setHours(hour, 0, 0, 0)
                          handleDateClick(clickedDate)
                        }}
                      />
                    ))}

                    {/* Events overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {dayEvents.map(event => {
                        const start = new Date(event.start)
                        const hour = start.getHours()
                        const minutes = start.getMinutes()
                        const top = (hour * 80) + (minutes / 60 * 80)
                        const eventType = EVENT_TYPES[Object.keys(EVENT_TYPES).find(key => EVENT_TYPES[key].id === event.type)]
                        const Icon = iconMap[eventType?.icon] || CalendarIcon

                        return (
                          <motion.div
                            key={event.id}
                            whileHover={{ scale: 1.02, zIndex: 10 }}
                            onClick={() => handleEventClick(event)}
                            className="absolute left-1 right-1 rounded-md p-2 text-xs cursor-pointer pointer-events-auto shadow-md hover:shadow-lg transition-all"
                            style={{
                              top: `${top}px`,
                              minHeight: '60px',
                              backgroundColor: event.color,
                              color: 'white'
                            }}
                          >
                            <div className="font-semibold mb-1 flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              <span className="truncate">{event.title}</span>
                            </div>
                            <div className="text-[10px] opacity-90">
                              {format(start, 'h:mm a')}
                            </div>
                            {event.location && (
                              <div className="text-[10px] opacity-80 flex items-center gap-1 mt-1">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All-day events section */}
          {weekDays.some(day => getEventsForDate(day).filter(e => e.allDay).length > 0) && (
            <div className="border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-8">
                <div className="p-2 text-xs font-semibold text-gray-600 border-r border-gray-200">
                  All Day
                </div>
                {weekDays.map(day => {
                  const allDayEvents = getEventsForDate(day).filter(e => e.allDay)
                  return (
                    <div key={day.toISOString()} className="p-2 border-r border-gray-200 min-h-[60px]">
                      <div className="space-y-1">
                        {allDayEvents.map(event => (
                          <motion.div
                            key={event.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleEventClick(event)}
                            className="px-2 py-1 rounded text-xs cursor-pointer transition-all font-medium shadow-sm"
                            style={{ backgroundColor: event.color, color: 'white' }}
                          >
                            {event.title}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(currentDate)
    const timedEvents = dayEvents.filter(e => !e.allDay)
    const allDayEvents = dayEvents.filter(e => e.allDay)

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {format(currentDate, 'EEEE')}
              </div>
              <div className="text-lg text-gray-600 mt-1">
                {format(currentDate, 'MMMM d, yyyy')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {format(currentDate, 'd')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
              </div>
            </div>
          </div>
        </div>

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="text-sm font-semibold text-gray-700 mb-3">All Day Events</div>
            <div className="space-y-2">
              {allDayEvents.map(event => {
                const eventType = EVENT_TYPES[Object.keys(EVENT_TYPES).find(key => EVENT_TYPES[key].id === event.type)]
                const Icon = iconMap[eventType?.icon] || CalendarIcon
                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.01, x: 4 }}
                    onClick={() => handleEventClick(event)}
                    className="p-3 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center gap-3"
                    style={{ backgroundColor: `${event.color}15`, borderLeft: `4px solid ${event.color}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${event.color}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: event.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{event.title}</div>
                      {event.location && (
                        <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Time-based events */}
        <div className="flex-1 overflow-auto max-h-[600px]">
          <div className="grid grid-cols-12">
            {/* Time labels */}
            <div className="col-span-2 border-r border-gray-200">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-gray-100 p-3 text-right">
                  <span className="text-sm font-medium text-gray-600">
                    {format(new Date().setHours(hour, 0), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>

            {/* Event timeline */}
            <div className="col-span-10 relative">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="h-20 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    const clickedDate = new Date(currentDate)
                    clickedDate.setHours(hour, 0, 0, 0)
                    handleDateClick(clickedDate)
                  }}
                />
              ))}

              {/* Events overlay */}
              <div className="absolute inset-0 pointer-events-none px-2">
                {timedEvents.map(event => {
                  const start = new Date(event.start)
                  const hour = start.getHours()
                  const minutes = start.getMinutes()
                  const top = (hour * 80) + (minutes / 60 * 80)
                  const eventType = EVENT_TYPES[Object.keys(EVENT_TYPES).find(key => EVENT_TYPES[key].id === event.type)]
                  const Icon = iconMap[eventType?.icon] || CalendarIcon

                  return (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      onClick={() => handleEventClick(event)}
                      className="absolute left-2 right-2 rounded-lg p-4 cursor-pointer pointer-events-auto shadow-md hover:shadow-lg transition-all"
                      style={{
                        top: `${top}px`,
                        minHeight: '70px',
                        backgroundColor: `${event.color}15`,
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${event.color}30` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: event.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">{event.title}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {format(start, 'h:mm a')}
                          </div>
                          {event.location && (
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </div>
                          )}
                          {event.description && (
                            <div className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case VIEW_TYPES.MONTH:
        return renderMonthView()
      case VIEW_TYPES.WEEK:
        return renderWeekView()
      case VIEW_TYPES.DAY:
        return renderDayView()
      default:
        return renderMonthView()
    }
  }

  const getViewTitle = () => {
    if (view === VIEW_TYPES.MONTH) {
      return format(currentDate, 'MMMM yyyy')
    } else if (view === VIEW_TYPES.WEEK) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM d, yyyy')
    }
  }

  const renderEventForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Event title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          rows="3"
          placeholder="Event description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
          <input
            type="datetime-local"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
          <input
            type="datetime-local"
            required
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="all_day"
          checked={formData.all_day}
          onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <label htmlFor="all_day" className="text-sm font-medium text-gray-700">All day event</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Add location"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {isEdit ? 'Update Event' : 'Create Event'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            isEdit ? setShowEditModal(false) : setShowCreateModal(false)
            resetForm()
          }}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Calendar
          </h1>
          <p className="text-gray-600">Manage your schedule and view all events</p>
        </div>
        <Button
          onClick={() => {
            setSelectedDate(new Date())
            setFormData({
              ...formData,
              start_time: format(new Date(), "yyyy-MM-dd'T'09:00"),
              end_time: format(new Date(), "yyyy-MM-dd'T'10:00")
            })
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevious}
                className="p-2 rounded-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToday}
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-white transition-colors"
              >
                Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="p-2 rounded-md hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {getViewTitle()}
            </div>
          </div>

          {/* View selector and filters */}
          <div className="flex items-center gap-2">
            {/* View buttons */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {Object.values(VIEW_TYPES).map(viewType => (
                <motion.button
                  key={viewType}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView(viewType)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${view === viewType
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {viewType}
                </motion.button>
              ))}
            </div>

            {/* Filter button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilters.length < Object.keys(EVENT_TYPES).length && (
                  <Badge variant="info" className="ml-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </motion.button>

              {/* Filter dropdown */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Event Types</h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {Object.values(EVENT_TYPES).map(eventType => (
                        <label
                          key={eventType.id}
                          className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={activeFilters.includes(eventType.id)}
                            onChange={() => handleFilterToggle(eventType.id)}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: eventType.color }}
                          />
                          <span className="text-sm text-gray-700 flex-1">{eventType.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {renderView()}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setSelectedEvent(null)
        }}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ backgroundColor: `${selectedEvent.color}20` }}
              >
                {(() => {
                  const eventType = EVENT_TYPES[Object.keys(EVENT_TYPES).find(key => EVENT_TYPES[key].id === selectedEvent.type)]
                  const Icon = iconMap[eventType?.icon] || CalendarIcon
                  return <Icon className="w-7 h-7" style={{ color: selectedEvent.color }} />
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedEvent.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(selectedEvent.start), 'EEEE, MMMM d, yyyy')}
                    {!selectedEvent.allDay && ` at ${format(new Date(selectedEvent.start), 'h:mm a')}`}
                  </span>
                </div>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent.location && (
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{selectedEvent.location}</span>
              </div>
            )}

            {selectedEvent.resource?.data && !selectedEvent.isCustom && (
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  {selectedEvent.resource.type === 'test_plan' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project:</span>
                        <span className="font-medium">{selectedEvent.resource.data.projectName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Test Type:</span>
                        <span className="font-medium">{selectedEvent.resource.data.testType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge>{selectedEvent.resource.data.status}</Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedEvent.isCustom ? (
                <>
                  <Button
                    onClick={handleEditEvent}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDeleteEvent}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    if (selectedEvent.resource) {
                      const routeMap = {
                        test_plan: '/lab/management/test-plans',
                        test_execution: '/lab/management/test-executions',
                        audit: '/lab/management/audits',
                        certification: '/lab/management/certifications',
                        project: '/lab/management/projects',
                        sample: '/lab/management/samples',
                        rfq: '/lab/management/rfqs'
                      }
                      const route = routeMap[selectedEvent.resource.type]
                      if (route) {
                        navigate(route)
                        setShowEventModal(false)
                      }
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  View Details
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowEventModal(false)
                  setSelectedEvent(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create New Event"
      >
        {renderEventForm(false)}
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEvent(null)
          resetForm()
        }}
        title="Edit Event"
      >
        {renderEventForm(true)}
      </Modal>
    </div>
  )
}

export default Calendar
