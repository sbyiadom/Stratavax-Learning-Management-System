// Before (causing error):
const uniqueCourses = [...new Set(courses?.map(c => c.course_name) || [])]

// After (compatible):
const uniqueCourses: string[] = []
if (courses) {
  courses.forEach(item => {
    if (item.course_name && !uniqueCourses.includes(item.course_name)) {
      uniqueCourses.push(item.course_name)
    }
  })
  uniqueCourses.sort()
}
