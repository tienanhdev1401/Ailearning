export default class Activities {
  constructor({ 
    activity_id, 
    skill, 
    point_of_ac, 
    order_index, 
    content, 
    resources,
    user_progress = []
  }) {
    this.activity_id = activity_id
    this.skill = skill
    this.point_of_ac = point_of_ac
    this.order_index = order_index
    this.content = content
    this.resources = resources
    this.user_progress = user_progress
  }
}
