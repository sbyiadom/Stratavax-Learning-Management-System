// Centralized course image mapping
// This ensures all components use the same image paths

export const COURSE_IMAGE_MAP: Record<string, string> = {
  // Existing images
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
  
  // Newly added images
  'web-development': '/images/web-development.jpg',
  'business-growth-strategy': '/images/business-growth-strategy.jpg',
  'entrepreneurship-pathway': '/images/entrepreneurship-pathway.jpg',
}

// Also add alternative slug variations if needed
export const COURSE_IMAGE_ALT_MAP: Record<string, string> = {
  // Handle different naming conventions
  'programming-fundamental': '/images/programming-fundamental.jpg',
  'marketing-&-sale': '/images/marketing-&-sale.jpg',
  'enterpreuship-pathway': '/images/entrepreneurship-pathway.jpg', // Handle typo
}

// Convert a title to a URL-friendly slug that matches image names
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Get image path for a course
export function getCourseImage(slug: string, title?: string): string | null {
  // First check if we have a direct mapping
  if (slug && COURSE_IMAGE_MAP[slug]) {
    return COURSE_IMAGE_MAP[slug]
  }
  
  // Check alternative mappings (for typos or different naming)
  if (slug && COURSE_IMAGE_ALT_MAP[slug]) {
    return COURSE_IMAGE_ALT_MAP[slug]
  }
  
  // If we have a title, try to generate a slug from it
  if (title) {
    const generatedSlug = titleToSlug(title)
    if (COURSE_IMAGE_MAP[generatedSlug]) {
      return COURSE_IMAGE_MAP[generatedSlug]
    }
    if (COURSE_IMAGE_ALT_MAP[generatedSlug]) {
      return COURSE_IMAGE_ALT_MAP[generatedSlug]
    }
  }
  
  // Return null to use fallback gradient
  return null
}

// Get image path with fallback
export function getCourseImageWithFallback(slug: string, title?: string): string | null {
  return getCourseImage(slug, title)
}

// Helper to check if a course has an image
export function hasCourseImage(slug: string, title?: string): boolean {
  return getCourseImage(slug, title) !== null
}

// Get all available course images (useful for debugging)
export function getAllCourseImages(): string[] {
  return Object.values(COURSE_IMAGE_MAP)
}

// Get image mapping for a specific course (returns both mapped and generated options)
export function getCourseImageOptions(slug: string, title?: string): {
  mapped: string | null
  generated: string | null
  titleBased: string | null
} {
  return {
    mapped: COURSE_IMAGE_MAP[slug] || COURSE_IMAGE_ALT_MAP[slug] || null,
    generated: slug ? ` /images/${slug}.jpg` : null,
    titleBased: title ? `/images/${titleToSlug(title)}.jpg` : null,
  }
}
