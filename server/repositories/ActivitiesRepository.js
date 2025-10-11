import prisma from '../config/prisma.js'
import Activities from '../domain/Activities.js'

export default class ActivitiesRepository {
  async create(data) {
    const r = await prisma.activities.create({ data })
    return new Activities(r)
  }

  async findAll() {
    const rows = await prisma.activities.findMany({
      orderBy: { order_index: 'asc' }
    })
    return rows.map(r => new Activities(r))
  }

  async findById(activityId) {
    const r = await prisma.activities.findUnique({
      where: { activity_id: Number(activityId) }
    })
    return r && new Activities(r)
  }

  async findByDayId(dayId) {
    const rows = await prisma.activities.findMany({
      where: { day_id: dayId },
      orderBy: { order_index: 'asc' }
    })
    return rows.map(r => new Activities(r))
  }

  async findByUserProgressId(userProgressId) {
    const rows = await prisma.activities.findMany({
      where: { user_progress_id: Number(userProgressId) },
      orderBy: { order_index: 'asc' }
    })
    return rows.map(r => new Activities(r))
  }

  async findBySkill(skill) {
    const rows = await prisma.activities.findMany({
      where: { skill },
      orderBy: { order_index: 'asc' }
    })
    return rows.map(r => new Activities(r))
  }

  async findByCompleted(isCompleted) {
    const rows = await prisma.activities.findMany({
      where: { is_completed: isCompleted },
      orderBy: { order_index: 'asc' }
    })
    return rows.map(r => new Activities(r))
  }

  async update(activityId, data) {
    const r = await prisma.activities.update({ where: { activity_id: Number(activityId) }, data })
    return new Activities(r)
  }

  async delete(activityId) {
    await prisma.activities.delete({ where: { activity_id: Number(activityId) } })
  }
}
