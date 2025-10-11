import prisma from '../config/prisma.js'
import Day from '../domain/Day.js'
import Activities from '../domain/Activities.js'

export default class DayRepository {
  async create(data) {
    const r = await prisma.days.create({ data })
    return new Day(r)
  }

  async findAll() {
    const rows = await prisma.days.findMany({
      include: { 
        activities: { 
          orderBy: { order_index: 'asc' } 
        } 
      },
      orderBy: { day_number: 'asc' }
    })
    return rows.map(r => new Day({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findById(dayId) {
    const r = await prisma.days.findUnique({
      where: { day_id: dayId },
      include: { 
        activities: { 
          orderBy: { order_index: 'asc' } 
        } 
      }
    })
    return r && new Day({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    })
  }

  async findByRoadmapId(roadmapId) {
    const rows = await prisma.days.findMany({
      where: { roadmap_id: Number(roadmapId) },
      include: { 
        activities: { 
          orderBy: { order_index: 'asc' } 
        } 
      },
      orderBy: { day_number: 'asc' }
    })
    return rows.map(r => new Day({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findByDayNumber(roadmapId, dayNumber) {
    const r = await prisma.days.findFirst({
      where: { 
        roadmap_id: Number(roadmapId),
        day_number: Number(dayNumber)
      },
      include: { 
        activities: { 
          orderBy: { order_index: 'asc' } 
        } 
      }
    })
    return r && new Day({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    })
  }

  async update(dayId, data) {
    const r = await prisma.days.update({ where: { day_id: dayId }, data })
    return new Day(r)
  }

  async delete(dayId) {
    await prisma.days.delete({ where: { day_id: dayId } })
  }
}
