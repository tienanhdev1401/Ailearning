import { useCallback, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';

const HOURS = [
  '6:00 AM',
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM'
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_OPTIONS = [
  { id: 'event', label: 'Events', color: 'var(--bs-primary)' },
  { id: 'meeting', label: 'Meetings', color: 'var(--bs-success)' },
  { id: 'task', label: 'Tasks', color: 'var(--bs-warning)' },
  { id: 'reminder', label: 'Reminders', color: '#8b5cf6' },
  { id: 'deadline', label: 'Deadlines', color: 'var(--bs-danger)' }
];

const EVENT_TEMPLATES = [
  { title: 'Team Meeting', type: 'meeting', time: '10:00', description: 'Weekly team sync and project updates' },
  { title: 'Product Launch', type: 'event', time: '14:00', description: 'Launch event for new product line' },
  { title: 'Stand-up', type: 'meeting', time: '09:00', description: 'Daily team stand-up meeting' },
  { title: 'Client Presentation', type: 'task', time: '11:30', description: 'Present quarterly results to client' },
  { title: 'Payment Due', type: 'reminder', time: '09:00', description: 'Monthly subscription payment reminder' },
  { title: 'Workshop', type: 'event', time: '14:00', description: 'Design thinking workshop' },
  { title: 'Project Deadline', type: 'deadline', time: '17:00', description: 'Final submission for Q1 project' },
  { title: 'Team Lunch', type: 'event', time: '12:00', description: 'Monthly team lunch gathering' },
  { title: 'Board Meeting', type: 'meeting', time: '15:00', description: 'Monthly board meeting and strategy review' },
  { title: 'Training Session', type: 'event', time: '13:00', description: 'Employee training on new software tools' },
  { title: 'One-on-One', type: 'meeting', time: '15:00', description: 'Manager check-in meeting' },
  { title: 'Code Review', type: 'task', time: '16:00', description: 'Review new feature implementations' },
  { title: 'Doctor Appointment', type: 'reminder', time: '14:30', description: 'Annual health checkup appointment' },
  { title: 'Release Planning', type: 'meeting', time: '10:00', description: 'Plan next release cycle' },
  { title: 'Demo Day', type: 'event', time: '14:00', description: 'Quarterly product demo' },
  { title: 'Conference Call', type: 'meeting', time: '10:00', description: 'International team coordination call' },
  { title: 'Sprint Review', type: 'meeting', time: '16:00', description: 'Review sprint deliverables' },
  { title: 'Budget Review', type: 'task', time: '11:00', description: 'Quarterly budget assessment' },
  { title: 'All Hands', type: 'meeting', time: '15:00', description: 'Company-wide monthly meeting' }
];

const toIsoDate = date => date.toISOString().split('T')[0];

const formatTimeLabel = time24 => {
  const [hours, minutes] = time24.split(':');
  const hourNumber = Number(hours);
  const hour12 = hourNumber % 12 || 12;
  const suffix = hourNumber >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${suffix}`;
};

const generateSampleEvents = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const events = [];
  let templateIndex = 0;

  const pushEvent = (eventDate, template, label) => {
    const isoDate = toIsoDate(eventDate);
    events.push({
      id: `${isoDate}-${template.title.replace(/\s+/g, '-')}`,
      title: template.title,
      type: template.type,
      time: template.time,
      timeStr: formatTimeLabel(template.time),
      dateStr: label,
      description: template.description,
      date: isoDate,
      dateObj: new Date(eventDate),
      read: Math.random() > 0.3
    });
  };

  for (let day = currentDay; day <= daysInMonth && templateIndex < EVENT_TEMPLATES.length; day += 1) {
    const shouldCreate = (day - currentDay) % 2 === 0 || day === currentDay || day === daysInMonth;
    if (!shouldCreate) continue;
    const template = EVENT_TEMPLATES[templateIndex];
    const eventDate = new Date(currentYear, currentMonth, day);
    let label = `${MONTH_NAMES[currentMonth]} ${day}`;
    if (day === currentDay) label = 'Today';
    else if (day === currentDay + 1) label = 'Tomorrow';
    pushEvent(eventDate, template, label);
    templateIndex += 1;
  }

  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let day = 1; day <= 10 && templateIndex < EVENT_TEMPLATES.length; day += 2) {
    const template = EVENT_TEMPLATES[templateIndex];
    const eventDate = new Date(nextYear, nextMonth, day);
    pushEvent(eventDate, template, `${MONTH_NAMES[nextMonth]} ${day}`);
    templateIndex += 1;
  }

  return events;
};

const isSameDay = (dateA, dateB) => dateA.toDateString() === dateB.toDateString();

const parseHourLabel = label => {
  if (!label) return null;
  const [time, suffix] = label.split(' ');
  const [rawHour] = time.split(':');
  let hour = Number(rawHour);
  const isPM = suffix === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour;
};

const matchesHour = (event, hourLabel) => {
  const eventHour = Number(event.time.split(':')[0]);
  return eventHour === parseHourLabel(hourLabel);
};

const CalendarPage = () => {
  const toast = useToast();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => toIsoDate(new Date()));
  const [visibleTypes, setVisibleTypes] = useState(() => CATEGORY_OPTIONS.map(option => option.id));
  const [events] = useState(() => generateSampleEvents());

  const notify = message => {
    toast.info(message);
  };

  const getEventsForDate = useCallback(dateString => events.filter(event => event.date === dateString), [events]);

  const getEventsForDateTime = useCallback((dateString, hourLabel) => getEventsForDate(dateString).filter(event => matchesHour(event, hourLabel)), [getEventsForDate]);

  const currentMonthYear = useMemo(
    () => miniCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [miniCalendarDate]
  );

  const currentPeriodTitle = useMemo(() => {
    if (currentView === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
    if (currentView === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate, currentView]);

  const selectedDayTitle = useMemo(() => {
    if (!selectedDay) return '';
    return new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDay]);

  const selectedDayDate = useMemo(() => {
    if (!selectedDay) return '';
    return new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDay]);

  const miniCalendarDays = useMemo(() => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const today = new Date();
    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const iso = toIsoDate(date);
      return {
        date: iso,
        day: date.getDate(),
        isToday: isSameDay(date, today),
        isOtherMonth: date.getMonth() !== month,
        isSelected: iso === selectedDay,
        hasEvents: getEventsForDate(iso).length > 0
      };
    });
  }, [miniCalendarDate, selectedDay, getEventsForDate]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const today = new Date();
    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const iso = toIsoDate(date);
      const dayEvents = getEventsForDate(iso).filter(event => visibleTypes.includes(event.type));
      return {
        date: iso,
        day: date.getDate(),
        isToday: isSameDay(date, today),
        isOtherMonth: date.getMonth() !== month,
        isSelected: iso === selectedDay,
        events: dayEvents
      };
    });
  }, [currentDate, selectedDay, visibleTypes, getEventsForDate]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return {
        date: toIsoDate(date),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: isSameDay(date, new Date())
      };
    });
  }, [currentDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => visibleTypes.includes(event.type) && event.dateObj >= now)
      .sort((a, b) => a.dateObj - b.dateObj);
  }, [events, visibleTypes]);

  const selectedDayEventCount = useMemo(() => {
    if (!selectedDay) return 0;
    return getEventsForDate(selectedDay).length;
  }, [selectedDay, getEventsForDate]);

  const isSelectedDayToday = selectedDay ? isSameDay(new Date(selectedDay), new Date()) : false;

  const getCategoryCount = type => events.filter(event => event.type === type).length;
  const getCategoryColor = type => CATEGORY_OPTIONS.find(option => option.id === type)?.color || 'var(--bs-primary)';

  const toggleCategory = type => {
    setVisibleTypes(prev => (prev.includes(type) ? prev.filter(item => item !== type) : [...prev, type]));
  };

  const selectDay = day => {
    setSelectedDay(day.date);
    if (currentView === 'day') {
      setCurrentDate(new Date(day.date));
    }
  };

  const selectDateFromString = dateString => {
    setSelectedDay(dateString);
    if (currentView === 'day') {
      setCurrentDate(new Date(dateString));
    }
  };

  const previousMonth = () => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setMiniCalendarDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setMiniCalendarDate(newDate);
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') newDate.setMonth(newDate.getMonth() - 1);
    if (currentView === 'week') newDate.setDate(newDate.getDate() - 7);
    if (currentView === 'day') newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (currentView === 'week') newDate.setDate(newDate.getDate() + 7);
    if (currentView === 'day') newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setMiniCalendarDate(today);
    setSelectedDay(toIsoDate(today));
  };

  const switchView = view => {
    setCurrentView(view);
    if (view === 'day' && !selectedDay) {
      setSelectedDay(toIsoDate(new Date()));
    }
  };

  const handleAddEvent = () => notify('Event creation modal would open here');
  const handleExportCalendar = () => notify('Calendar export would trigger here');
  const handleViewEvent = event => notify(`${event.title} at ${event.timeStr}`);
  const handleAddEventForDay = day => notify(`Add event for ${day.date}`);
  const handleAddEventAtTime = (dateString, hourLabel) => {
    if (!dateString) return;
    notify(`Add event on ${dateString} at ${hourLabel}`);
  };
  const handleShowMoreEvents = day => notify(`Show all events for ${day.date}`);

  const isCurrentHour = hourLabel => parseHourLabel(hourLabel) === new Date().getHours();

  return (
    <div className="calendar-page container-fluid p-4 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Calendar</h1>
          <p className="text-muted mb-0">Schedule and manage your events</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary d-lg-none" onClick={() => setSidebarVisible(value => !value)}>
            <i className="bi bi-calendar3 me-2" />Mini Calendar
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleExportCalendar}>
            <i className="bi bi-download me-2" />Export
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAddEvent}>
            <i className="bi bi-plus-lg me-2" />Add Event
          </button>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-layout">
          <div className={`calendar-sidebar${sidebarVisible ? ' mobile-show' : ''}`}>
            <div className="calendar-sidebar-header">
              <h5 className="sidebar-title mb-0">Calendar</h5>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleAddEvent}>
                <i className="bi bi-plus-lg" />
              </button>
            </div>

            <div className="mini-calendar">
              <div className="mini-calendar-header">
                <div className="d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={previousMonth}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  <h6 className="mb-0 fw-semibold">{currentMonthYear}</h6>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={nextMonth}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
              <div className="mini-calendar-weekdays">
                <div className="weekday">S</div>
                <div className="weekday">M</div>
                <div className="weekday">T</div>
                <div className="weekday">W</div>
                <div className="weekday">T</div>
                <div className="weekday">F</div>
                <div className="weekday">S</div>
              </div>
              <div className="mini-calendar-grid">
                {miniCalendarDays.map(day => (
                  <button
                    type="button"
                    key={day.date}
                    className={`mini-calendar-day${day.isToday ? ' today' : ''}${day.isOtherMonth ? ' other-month' : ''}${day.isSelected ? ' selected' : ''}${day.hasEvents ? ' has-events' : ''}`}
                    onClick={() => selectDateFromString(day.date)}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="event-categories">
              <h6 className="category-title">Event Categories</h6>
              <div className="category-list">
                {CATEGORY_OPTIONS.map(option => (
                  <label key={option.id} className="category-item">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={visibleTypes.includes(option.id)}
                      onChange={() => toggleCategory(option.id)}
                    />
                    <span className="category-color" style={{ background: option.color }} />
                    <span className="category-name">{option.label}</span>
                    <span className="category-count">{getCategoryCount(option.id)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="upcoming-events">
              <h6 className="upcoming-title">Upcoming Events</h6>
              <div className="upcoming-list">
                {upcomingEvents.slice(0, 5).map(event => (
                  <button type="button" key={event.id} className="upcoming-item" onClick={() => handleViewEvent(event)}>
                    <div className="upcoming-time">
                      <span className="time">{event.timeStr}</span>
                      <span className="date">{event.dateStr}</span>
                    </div>
                    <div className="upcoming-content">
                      <h6 className="upcoming-event-title">{event.title}</h6>
                      <p className="upcoming-description">{event.description}</p>
                    </div>
                    <div className="upcoming-indicator" style={{ background: getCategoryColor(event.type) }} />
                  </button>
                ))}
                {upcomingEvents.length === 0 && (
                  <div className="upcoming-empty">
                    <i className="bi bi-calendar-check" />
                    <p>No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="calendar-main">
            <div className="calendar-header">
              <div className="calendar-nav-left">
                <button type="button" className="btn btn-link d-lg-none me-2 p-0" onClick={() => setSidebarVisible(value => !value)}>
                  <i className="bi bi-list fs-5" />
                </button>
                <div className="calendar-nav-controls">
                  <button type="button" className="btn btn-outline-secondary" onClick={previousPeriod}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  <button type="button" className="btn btn-outline-primary" onClick={goToToday}>
                    Today
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={nextPeriod}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
                <h3 className="calendar-title">{currentPeriodTitle}</h3>
              </div>
              <div className="calendar-nav-right">
                <div className="view-switcher">
                  <button type="button" className={`view-btn${currentView === 'month' ? ' active' : ''}`} onClick={() => switchView('month')}>
                    <i className="bi bi-calendar3 me-1" />Month
                  </button>
                  <button type="button" className={`view-btn${currentView === 'week' ? ' active' : ''}`} onClick={() => switchView('week')}>
                    <i className="bi bi-calendar2-week me-1" />Week
                  </button>
                  <button type="button" className={`view-btn${currentView === 'day' ? ' active' : ''}`} onClick={() => switchView('day')}>
                    <i className="bi bi-calendar-day me-1" />Day
                  </button>
                </div>
              </div>
            </div>

            <div className="calendar-content">
              {currentView === 'month' && (
                <div className="month-view">
                  <div className="month-header">
                    <div className="month-header-day">Sunday</div>
                    <div className="month-header-day">Monday</div>
                    <div className="month-header-day">Tuesday</div>
                    <div className="month-header-day">Wednesday</div>
                    <div className="month-header-day">Thursday</div>
                    <div className="month-header-day">Friday</div>
                    <div className="month-header-day">Saturday</div>
                  </div>
                  <div className="month-grid">
                    {calendarDays.map(day => (
                      <div
                        key={day.date}
                        className={`month-day${day.isToday ? ' today' : ''}${day.isOtherMonth ? ' other-month' : ''}${day.isSelected ? ' selected' : ''}${day.events.length > 0 ? ' has-events' : ''}`}
                        onClick={() => selectDay(day)}
                        onDoubleClick={() => handleAddEventForDay(day)}
                      >
                        <div className="day-number">{day.day}</div>
                        <div className="day-events">
                          {day.events.slice(0, 3).map(event => (
                            <button
                              type="button"
                              key={event.id}
                              className={`day-event event-${event.type}`}
                              onClick={eventInstance => {
                                eventInstance.stopPropagation();
                                handleViewEvent(event);
                              }}
                            >
                              <span className="event-title">{event.title}</span>
                            </button>
                          ))}
                          {day.events.length > 3 && (
                            <button
                              type="button"
                              className="more-events"
                              onClick={eventInstance => {
                                eventInstance.stopPropagation();
                                handleShowMoreEvents(day);
                              }}
                            >
                              +{day.events.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'week' && (
                <div className="week-view">
                  <div className="week-header">
                    <div className="time-column">Time</div>
                    {weekDays.map(day => (
                      <div key={day.date} className={`week-day-header${day.isToday ? ' today' : ''}`}>
                        <div className="day-name">{day.dayName}</div>
                        <div className="day-number">{day.dayNumber}</div>
                      </div>
                    ))}
                  </div>
                  <div className="week-grid">
                    <div className="time-slots">
                      {HOURS.map(hour => (
                        <div key={hour} className="time-slot">
                          {hour}
                        </div>
                      ))}
                    </div>
                    <div className="week-days">
                      {weekDays.map(day => (
                        <div key={day.date} className={`week-day-column${day.isToday ? ' today' : ''}`}>
                          {HOURS.map(hour => (
                            <div key={hour} className="hour-slot" onDoubleClick={() => handleAddEventAtTime(day.date, hour)} onClick={() => handleAddEventAtTime(day.date, hour)}>
                              {getEventsForDateTime(day.date, hour).map(event => (
                                <button
                                  type="button"
                                  key={event.id}
                                  className={`week-event event-${event.type}`}
                                  onClick={eventInstance => {
                                    eventInstance.stopPropagation();
                                    handleViewEvent(event);
                                  }}
                                >
                                  <div className="event-time">{event.time}</div>
                                  <div className="event-title">{event.title}</div>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'day' && (
                <div className="day-view">
                  <div className="day-view-header">
                    <div className="day-info">
                      <h4 className="day-title">{selectedDayTitle}</h4>
                      <p className="day-date">{selectedDayDate}</p>
                    </div>
                    <div className="day-stats">
                      <div className="stat-item">
                        <span className="stat-value">{selectedDayEventCount}</span>
                        <span className="stat-label">Events</span>
                      </div>
                    </div>
                  </div>
                  <div className="day-schedule">
                    <div className="schedule-times">
                      {HOURS.map(hour => (
                        <div key={hour} className="schedule-time">
                          {hour}
                        </div>
                      ))}
                    </div>
                    <div className="schedule-events">
                      {HOURS.map(hour => (
                        <div key={hour} className="schedule-hour" onClick={() => handleAddEventAtTime(selectedDay, hour)} onDoubleClick={() => handleAddEventAtTime(selectedDay, hour)}>
                          {getEventsForDateTime(selectedDay, hour).map(event => (
                            <button
                              type="button"
                              key={event.id}
                              className={`schedule-event event-${event.type}`}
                              onClick={eventInstance => {
                                eventInstance.stopPropagation();
                                handleViewEvent(event);
                              }}
                            >
                              <div className="event-time">{event.time}</div>
                              <div className="event-title">{event.title}</div>
                              <div className="event-description">{event.description}</div>
                            </button>
                          ))}
                          {isCurrentHour(hour) && isSelectedDayToday && <div className="current-time-indicator" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
