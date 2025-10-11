import prisma from '../config/prisma.js'
import UserProgress from '../domain/UserProgress.js'
import Activities from '../domain/Activities.js'

export default class UserProgressRepository {
  async create(data) {
    const r = await prisma.user_progress.create({ data })
    return new UserProgress(r)
  }

  async findAll() {
    const rows = await prisma.user_progress.findMany({
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return rows.map(r => new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findById(progressId) {
    const r = await prisma.user_progress.findUnique({
      where: { progress_id: Number(progressId) },
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      }
    })
    return r && new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    })
  }

  async findByUserId(userId) {
    const rows = await prisma.user_progress.findMany({
      where: { user_id: Number(userId) },
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return rows.map(r => new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findByRoadmapId(roadmapId) {
    const rows = await prisma.user_progress.findMany({
      where: { roadmap_id: Number(roadmapId) },
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return rows.map(r => new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findByDayId(dayId) {
    const rows = await prisma.user_progress.findMany({
      where: { day_id: dayId },
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return rows.map(r => new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findByUserAndRoadmap(userId, roadmapId) {
    const rows = await prisma.user_progress.findMany({
      where: { 
        user_id: Number(userId),
        roadmap_id: Number(roadmapId)
      },
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return rows.map(r => new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }

  async findByUserAndDay(userId, dayId) {
    const r = await prisma.user_progress.findFirst({
      where: { 
        user_id: Number(userId),
        day_id: dayId
      },
      include: {
        activities: {
          orderBy: { order_index: 'asc' }
        }
      }
    })
    return r && new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    })
  }

  async update(progressId, data) {
    const r = await prisma.user_progress.update({ where: { progress_id: Number(progressId) }, data })
    return new UserProgress(r)
  }

  async delete(progressId) {
    await prisma.user_progress.delete({ where: { progress_id: Number(progressId) } })
  }

  async getProgressByUser(userId) {
    const rows = await prisma.user_progress.findMany({
      where: { user_id: Number(userId) },
      include: {
        roadmap: true,
        day: true,
        activities: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return rows.map(r => new UserProgress({ 
      ...r, 
      activities: r.activities.map(a => new Activities(a)) 
    }))
  }
}
