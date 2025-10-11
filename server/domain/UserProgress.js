export default class UserProgress {
  constructor({ 
    progress_id, 
    is_completed = false,
    time_spent,
    completed_at,
  }) {
    this.progress_id = progress_id
    this.is_completed = is_completed
    this.time_spent = time_spent
    this.completed_at = completed_at
  }
}
