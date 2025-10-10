import prisma from '../config/prisma.js'
import Lesson from '../domain/Lesson.js'
import Subtitle from '../domain/Subtitle.js'

export default class LessonRepository {
  async create(data) {
    const r = await prisma.lessons.create({ data })
    return new Lesson(r)
  }

  async findAll() {
    const rows = await prisma.lessons.findMany({
      include: { subtitles: { orderBy: { id: 'asc' } } },
      orderBy: { id: 'asc' }
    })
    return rows.map(r => new Lesson({ ...r, subtitles: r.subtitles.map(s => new Subtitle(s)) }))
  }

  async findById(id) {
    const r = await prisma.lessons.findUnique({
      where: { id: Number(id) },
      include: { subtitles: { orderBy: { id: 'asc' } } }
    })
    return r && new Lesson({ ...r, subtitles: r.subtitles.map(s => new Subtitle(s)) })
  }

  async update(id, data) {
    const r = await prisma.lessons.update({ where: { id: Number(id) }, data })
    return new Lesson(r)
  }

  async delete(id) {
    await prisma.lessons.delete({ where: { id: Number(id) } })
  }
}


