import prisma from '../config/prisma.js'
import User from '../domain/User.js'

export default class UserRepository {
  async findAll() {
    const rows = await prisma.users.findMany()
    return rows.map(r => new User(r))
  }

  async findById(id) {
    const r = await prisma.users.findUnique({ where: { id: Number(id) } })
    return r && new User(r)
  }

  async findByEmail(email) {
    const r = await prisma.users.findUnique({ where: { email } })
    return r && new User(r)
  }

  async create(user) {
    const r = await prisma.users.create({
      data: { name: user.name, email: user.email, password: user.password, role: user.role, authProvider: user.authProvider }
    })
    return new User(r)
  }

  async update(id, data) {
    const r = await prisma.users.update({ where: { id: Number(id) }, data })
    return new User(r)
  }

  async delete(id) {
    await prisma.users.delete({ where: { id: Number(id) } })
  }
}


