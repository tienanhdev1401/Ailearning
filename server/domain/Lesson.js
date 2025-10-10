export default class Lesson {
  constructor({ id, title, video_url, thumbnail_url, created_at, subtitles = [] }) {
    this.id = id
    this.title = title
    this.video_url = video_url
    this.thumbnail_url = thumbnail_url
    this.created_at = created_at
    this.subtitles = subtitles
  }
}


