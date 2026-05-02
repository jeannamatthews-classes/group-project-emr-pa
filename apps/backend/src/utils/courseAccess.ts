import { prisma } from '../db';

export function isAdminRole(role: string | undefined): boolean {
  return role === 'admin';
}

export function isFacultyRole(role: string | undefined): boolean {
  return role === 'faculty' || role === 'admin';
}

export async function canManageCourse(
  courseId: string | null | undefined,
  userId: string,
  role: string | undefined
): Promise<boolean> {
  if (!courseId) return false;
  if (isAdminRole(role)) return true;

  const membership = await prisma.courseMember.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
    select: { role: true },
  });

  return membership?.role === 'faculty';
}

export async function isStudentInCourse(
  courseId: string | null | undefined,
  studentId: string
): Promise<boolean> {
  if (!courseId) return false;

  const membership = await prisma.courseMember.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: studentId,
      },
    },
    select: { role: true },
  });

  return membership?.role === 'student';
}

export async function getManageableCourseIds(
  userId: string,
  role: string | undefined
): Promise<string[] | null> {
  if (isAdminRole(role)) return null;

  const memberships = await prisma.courseMember.findMany({
    where: {
      userId,
      role: 'faculty',
    },
    select: { courseId: true },
  });

  return memberships.map((membership) => membership.courseId);
}

export async function getStudentCourseIds(studentId: string): Promise<string[]> {
  const memberships = await prisma.courseMember.findMany({
    where: {
      userId: studentId,
      role: 'student',
    },
    select: { courseId: true },
  });

  return memberships.map((membership) => membership.courseId);
}
