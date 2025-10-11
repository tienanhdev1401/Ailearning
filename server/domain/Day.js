export default class Day {
  constructor({ 
    day_id, 
    day_number, 
    theme, 
    description, 
    condition, 
    activities = [] 
  }) {
    this.day_id = day_id
    this.day_number = day_number
    this.theme = theme
    this.description = description
    this.condition = condition
    this.activities = activities
  }

}