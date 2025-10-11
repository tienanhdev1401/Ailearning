export default class Roadmap {
  constructor({ 
    level_id, 
    level_name, 
    description, 
    days = [] 
  }) {
    this.level_id = level_id
    this.level_name = level_name
    this.description = description
    this.days = days
  }
}
