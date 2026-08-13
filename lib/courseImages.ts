// Centralized course image mapping
// This ensures all components use the same image paths

export const COURSE_IMAGE_MAP: Record<string, string> = {
  // ============================================================
  // NEW COURSES (Just Added)
  // ============================================================
  'effective-leadership-talent-management': '/images/Effective Leadership.jpg',
  'power-influence-leadership': '/images/Power & Influence.jpg',
  'leading-inclusive-workforce': '/images/Inclusive Workforce.jpg',
  'personality-transformations': '/images/Personality Transformations.jpg',
  'assertive-communication-eq': '/images/Assertive Communication.jpg',
  'mental-reset-wellness': '/images/Mental Reset & Wellness.jpg',
  'cs50-web-programming': '/images/CS50 Web Programming.jpg',
  'cs50-computer-science': '/images/CS50 Computer Science.jpg',
  
  // ============================================================
  // EXISTING COURSES
  // ============================================================
  'microsoft-office': '/images/microsoft-office.jpg',
  'ai-fundamentals': '/images/AI-Fundamentals.jpg',
  'basic-mechanical-engineering': '/images/basic-mechanical-engineering.jpg',
  'data-analysis': '/images/data-analysis.jpg',
  'business-model-design': '/images/business-model-design.jpg',
  'business-plan-development': '/images/business-plan-development.jpg',
  'digital-marketing': '/images/digital-marketing.jpg',
  'electrical-engineering': '/images/electrical-engineering.jpg',
  'financial-literacy': '/images/financial-literacy.jpg',
  'leadership': '/images/leadership.jpg',
  'marketing-sales': '/images/marketing-&-sale.jpg',
  'programming-fundamentals': '/images/programming-fundamental.jpg',
  'web-development': '/images/web-development.jpg',
  'business-growth-strategy': '/images/business-growth-strategy.jpg',
  'entrepreneurship-pathway': '/images/entrepreneurship-pathway.jpg',
}

// Alternative slug variations
export const COURSE_IMAGE_ALT_MAP: Record<string, string> = {
  'programming-fundamental': '/images/programming-fundamental.jpg',
  'marketing-&-sale': '/images/marketing-&-sale.jpg',
  'enterpreuship-pathway': '/images/entrepreneurship-pathway.jpg',
}

// Convert a title to a URL-friendly slug
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Get image path for a course
export function getCourseImage(slug: string, title?: string): string | null {
  if (slug && COURSE_IMAGE_MAP[slug]) {
    return COURSE_IMAGE_MAP[slug]
  }
  
  if (slug && COURSE_IMAGE_ALT_MAP[slug]) {
    return COURSE_IMAGE_ALT_MAP[slug]
  }
  
  if (title) {
    const generatedSlug = titleToSlug(title)
    if (COURSE_IMAGE_MAP[generatedSlug]) {
      return COURSE_IMAGE_MAP[generatedSlug]
    }
    if (COURSE_IMAGE_ALT_MAP[generatedSlug]) {
      return COURSE_IMAGE_ALT_MAP[generatedSlug]
    }
  }
  
  return null
}
