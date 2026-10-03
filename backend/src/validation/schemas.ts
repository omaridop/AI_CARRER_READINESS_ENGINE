/**
 * Manual validation functions for API inputs to prevent unhandled exceptions.
 */

export function validateProfileBody(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object';
  if (!body.name || typeof body.name !== 'string') return 'Missing or invalid field: name';
  if (body.email && typeof body.email !== 'string') return 'Invalid field: email';
  
  if (!Array.isArray(body.skills)) return 'Missing or invalid field: skills (must be an array)';
  
  for (let i = 0; i < body.skills.length; i++) {
    const s = body.skills[i];
    if (!s.skillId || typeof s.skillId !== 'number') return `Invalid skill at index ${i}: missing skillId`;
    if (!['beginner', 'intermediate', 'advanced'].includes(s.proficiency)) {
      return `Invalid proficiency at index ${i}: must be beginner, intermediate, or advanced`;
    }
    if (!['self_declared', 'course', 'project', 'certificate'].includes(s.evidenceType)) {
      return `Invalid evidenceType at index ${i}: must be self_declared, course, project, or certificate`;
    }
  }
  
  return null; // No errors
}

export function validateAnalysisBody(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object';
  if (!body.studentId || typeof body.studentId !== 'number') return 'Missing or invalid field: studentId';
  if (!body.roleName || typeof body.roleName !== 'string') return 'Missing or invalid field: roleName';
  
  return null;
}
