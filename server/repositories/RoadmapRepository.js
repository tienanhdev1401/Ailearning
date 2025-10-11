import prisma from '../config/prisma.js'
import Roadmap from '../domain/Roadmap.js'
import Day from '../domain/Day.js'

export default class RoadmapRepository {
  async create(data) {
    const { days, ...roadmapData } = data;

    // build phần create cho days chỉ khi có days và có phần tử
    const daysCreate = Array.isArray(days) && days.length
      ? days.map(day => {
          const { activities, ...dayData } = day;
          return {
            ...dayData,
            // include activities create only if activities is non-empty array
            ...(Array.isArray(activities) && activities.length
              ? { activities: { create: activities.map(act => ({ ...act })) } }
              : {})
          };
        })
      : undefined;

    const prismaData = {
      ...roadmapData,
      // chỉ thêm khóa days khi daysCreate khác undefined
      ...(daysCreate ? { days: { create: daysCreate } } : {})
    };

    const r = await prisma.roadmaps.create({
      data: prismaData,
      include: {
        days: {
          include: {
            activities: true
          }
        }
      }
    });

    return new Roadmap(r);
  }

  async findAll() {
    const rows = await prisma.roadmaps.findMany({
      include: { 
        days: { 
          orderBy: { day_number: 'asc' },
          include: {
            activities: {
              orderBy: { order_index: 'asc' }
            }
          }
        } 
      },
      orderBy: { id: 'asc' }
    })
    return rows.map(r => new Roadmap({ 
      ...r, 
      days: r.days.map(d => new Day(d)) 
    }))
  }

  async findById(id) {
    const r = await prisma.roadmaps.findUnique({
      where: { level_id: Number(id) },
      include: { 
        days: { 
          orderBy: { day_number: 'asc' },
          include: {
            activities: {
              orderBy: { order_index: 'asc' }
            }
          }
        } 
      }
    })
    return r && new Roadmap({ 
      ...r, 
      days: r.days.map(d => new Day(d)) 
    })
  }

  async findByLevel(level) {
    const rows = await prisma.roadmaps.findMany({
      where: { level },
      include: { 
        days: { 
          orderBy: { day_number: 'asc' },
          include: {
            activities: {
              orderBy: { order_index: 'asc' }
            }
          }
        } 
      },
      orderBy: { id: 'asc' }
    })
    return rows.map(r => new Roadmap({ 
      ...r, 
      days: r.days.map(d => new Day(d)) 
    }))
  }

  async update(id, data) {
    const r = await prisma.roadmaps.update({ where: { id: Number(id) }, data })
    return new Roadmap(r)
  }

  async delete(id) {
    await prisma.roadmaps.delete({ where: { id: Number(id) } })
  }
}
