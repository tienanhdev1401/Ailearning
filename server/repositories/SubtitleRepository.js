import prisma from '../config/prisma.js'
import Subtitle from '../domain/Subtitle.js'

export default class SubtitleRepository {
  async findByLessonId(lessonId) {
    const rows = await prisma.subtitles.findMany({ where: { lesson_id: Number(lessonId) }, orderBy: { id: 'asc' } })
    return rows.map(r => new Subtitle(r))
  }

  async createManyRaw(data) {
    if (!data.length) return 0
    const res = await prisma.subtitles.createMany({ data })
    return res.count || data.length
  }

  async deleteByLessonId(lessonId) {
    await prisma.subtitles.deleteMany({ where: { lesson_id: Number(lessonId) } })
  }
}


