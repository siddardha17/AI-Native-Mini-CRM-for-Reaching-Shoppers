import prisma from '../lib/prisma.js';
import type { SegmentRule } from '../types/index.js';
import type { Prisma } from '@prisma/client';

/**
 * Converts an array of SegmentRule objects into a Prisma `where` clause.
 *
 * Rules are combined with their `connector` field (default AND).
 * Supports numeric comparisons, string contains, array membership,
 * date comparisons, and range checks.
 */
export function evaluateSegmentRules(rules: SegmentRule[]): Prisma.CustomerWhereInput {
  if (!rules || rules.length === 0) {
    return {};
  }

  const conditions: Prisma.CustomerWhereInput[] = rules.map((rule) => {
    return buildCondition(rule);
  });

  // Group by connector: default is AND
  // We walk through rules and split into OR-groups.
  // Rules connected by AND are grouped together; OR creates a new group.
  const orGroups: Prisma.CustomerWhereInput[][] = [[]];

  for (let i = 0; i < conditions.length; i++) {
    orGroups[orGroups.length - 1].push(conditions[i]);
    // If this rule's connector is OR, start a new group for the next rule
    if (i < conditions.length - 1 && rules[i].connector === 'OR') {
      orGroups.push([]);
    }
  }

  if (orGroups.length === 1) {
    return { AND: orGroups[0] };
  }

  return {
    OR: orGroups.map((group) =>
      group.length === 1 ? group[0] : { AND: group }
    ),
  };
}

function buildCondition(rule: SegmentRule): Prisma.CustomerWhereInput {
  const { field, operator, value } = rule;

  // Handle tag-based rules specially since tags is a String[] field
  if (field === 'tags') {
    switch (operator) {
      case 'contains':
        return { tags: { has: value } };
      case 'not_contains':
        return { NOT: { tags: { has: value } } };
      case 'in':
        return { tags: { hasSome: Array.isArray(value) ? value : [value] } };
      default:
        return { tags: { has: value } };
    }
  }

  // Date fields
  if (field === 'lastVisitAt' || field === 'createdAt' || field === 'updatedAt') {
    const dateValue = new Date(value as string);
    switch (operator) {
      case 'before':
      case 'lt':
        return { [field]: { lt: dateValue } };
      case 'after':
      case 'gt':
        return { [field]: { gt: dateValue } };
      case 'between': {
        const [start, end] = value as [string, string];
        return { [field]: { gte: new Date(start), lte: new Date(end) } };
      }
      case 'eq':
        return { [field]: { equals: dateValue } };
      default:
        return { [field]: { equals: dateValue } };
    }
  }

  // Numeric fields
  if (field === 'totalSpend' || field === 'visitCount') {
    const numValue = Number(value);
    switch (operator) {
      case 'gt':
        return { [field]: { gt: numValue } };
      case 'gte':
        return { [field]: { gte: numValue } };
      case 'lt':
        return { [field]: { lt: numValue } };
      case 'lte':
        return { [field]: { lte: numValue } };
      case 'eq':
        return { [field]: { equals: numValue } };
      case 'neq':
        return { [field]: { not: numValue } };
      case 'between': {
        const [min, max] = value as [number, number];
        return { [field]: { gte: Number(min), lte: Number(max) } };
      }
      default:
        return { [field]: { equals: numValue } };
    }
  }

  // String fields (name, email, city, phone)
  switch (operator) {
    case 'eq':
      return { [field]: { equals: value, mode: 'insensitive' as const } };
    case 'neq':
      return { NOT: { [field]: { equals: value, mode: 'insensitive' as const } } };
    case 'contains':
      return { [field]: { contains: value, mode: 'insensitive' as const } };
    case 'not_contains':
      return { NOT: { [field]: { contains: value, mode: 'insensitive' as const } } };
    case 'in':
      return { [field]: { in: Array.isArray(value) ? value : [value], mode: 'insensitive' as const } };
    case 'not_in':
      return { NOT: { [field]: { in: Array.isArray(value) ? value : [value], mode: 'insensitive' as const } } };
    default:
      return { [field]: { equals: value } };
  }
}

/**
 * Materializes a segment: evaluates its rules against all customers,
 * replaces SegmentMember rows, and updates customerCount.
 */
export async function materializeSegment(segmentId: string): Promise<number> {
  const segment = await prisma.segment.findUniqueOrThrow({
    where: { id: segmentId },
  });

  const rules = segment.rules as unknown as SegmentRule[];
  const whereClause = evaluateSegmentRules(rules);

  // Find all matching customer IDs
  const matchingCustomers = await prisma.customer.findMany({
    where: whereClause,
    select: { id: true },
  });

  const customerIds = matchingCustomers.map((c) => c.id);

  // Replace all segment members in a transaction
  await prisma.$transaction([
    // Delete existing members
    prisma.segmentMember.deleteMany({
      where: { segmentId },
    }),
    // Insert new members
    ...(customerIds.length > 0
      ? [
          prisma.segmentMember.createMany({
            data: customerIds.map((customerId) => ({
              segmentId,
              customerId,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
    // Update customer count
    prisma.segment.update({
      where: { id: segmentId },
      data: { customerCount: customerIds.length },
    }),
  ]);

  return customerIds.length;
}

/**
 * Preview: returns the count of customers matching the given rules
 * without actually materializing the segment.
 */
export async function previewSegment(rules: SegmentRule[]): Promise<number> {
  const whereClause = evaluateSegmentRules(rules);
  return prisma.customer.count({ where: whereClause });
}
