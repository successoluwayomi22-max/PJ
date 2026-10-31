import type {
  AuditLogEntry,
  AuthorizationResult,
  NewsPost,
  PermissionIdentifier,
  PostStatus,
  RoleDefinition,
  SystemRole,
  User,
} from '../types.ts';

/**
 * =====================================================================
 * ENTERPRISE RBAC PERMISSION CATALOG & SYSTEM ROLES MATRIX
 * =====================================================================
 * Deny by Default • Explicit Least Privilege • Separation of Duties
 */

export const ALL_PERMISSIONS: PermissionIdentifier[] = [
  // User Management
  'users.view',
  'users.view_any',
  'users.create',
  'users.update',
  'users.update_own',
  'users.update_any',
  'users.suspend',
  'users.restore',
  'users.delete',
  'users.export',
  'users.manage_roles',

  // Role Management
  'roles.view',
  'roles.create',
  'roles.update',
  'roles.delete',
  'roles.assign',
  'permissions.view',
  'permissions.assign',

  // Article Management
  'articles.view',
  'articles.view_any',
  'articles.create',
  'articles.update',
  'articles.update_own',
  'articles.update_any',
  'articles.delete',
  'articles.delete_own',
  'articles.delete_any',
  'articles.submit',
  'articles.review',
  'articles.approve',
  'articles.reject',
  'articles.publish',
  'articles.unpublish',
  'articles.schedule',
  'articles.archive',
  'articles.restore',

  // Category Management
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',

  // Media Management
  'media.view',
  'media.upload',
  'media.update',
  'media.delete',
  'media.manage_all',

  // Comment Management
  'comments.view',
  'comments.create',
  'comments.update_own',
  'comments.delete_own',
  'comments.moderate',
  'comments.approve',
  'comments.reject',
  'comments.report',

  // Advertising
  'ads.view',
  'ads.create',
  'ads.update',
  'ads.delete',
  'ads.publish',
  'ads.analytics',

  // Analytics
  'analytics.view',
  'analytics.view_editorial',
  'analytics.view_financial',
  'analytics.export',

  // System Settings
  'settings.view',
  'settings.update',
  'settings.security.manage',
  'settings.integrations.manage',
  'settings.backups.manage',

  // Audit Logs
  'audit.view',
  'audit.export',

  // Newsletter
  'newsletter.view',
  'newsletter.manage',
  'newsletter.send',
  'newsletter.export',
];

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'super_admin',
    label: 'Super Administrator',
    description:
      'Highest platform-level authority. Manages administrators, system configuration, security policies, and granular roles.',
    isSystem: true,
    priority: 100,
    permissions: [...ALL_PERMISSIONS],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'admin',
    name: 'admin',
    label: 'Administrator',
    description:
      'General platform administration: content, categories, media, comments, advertisements, and operational moderation.',
    isSystem: true,
    priority: 80,
    permissions: [
      'users.view',
      'users.view_any',
      'users.create',
      'users.update',
      'users.update_any',
      'users.suspend',
      'users.restore',
      'users.export',
      'roles.view',
      'permissions.view',
      'articles.view',
      'articles.view_any',
      'articles.create',
      'articles.update',
      'articles.update_any',
      'articles.delete_any',
      'articles.review',
      'articles.approve',
      'articles.reject',
      'articles.publish',
      'articles.unpublish',
      'articles.schedule',
      'articles.archive',
      'articles.restore',
      'categories.view',
      'categories.create',
      'categories.update',
      'categories.delete',
      'media.view',
      'media.upload',
      'media.update',
      'media.delete',
      'media.manage_all',
      'comments.view',
      'comments.create',
      'comments.update_own',
      'comments.delete_own',
      'comments.moderate',
      'comments.approve',
      'comments.reject',
      'ads.view',
      'ads.create',
      'ads.update',
      'ads.delete',
      'ads.publish',
      'ads.analytics',
      'analytics.view',
      'analytics.view_editorial',
      'analytics.export',
      'settings.view',
      'settings.update',
      'audit.view',
      'newsletter.view',
      'newsletter.manage',
      'newsletter.send',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'managing_editor',
    name: 'managing_editor',
    label: 'Managing Editor',
    description:
      'Oversees newsroom editorial lifecycle: reviews submissions, schedules and publishes approved dispatches, assigns topics.',
    isSystem: true,
    priority: 60,
    permissions: [
      'articles.view',
      'articles.view_any',
      'articles.create',
      'articles.update',
      'articles.update_own',
      'articles.update_any',
      'articles.delete_own',
      'articles.submit',
      'articles.review',
      'articles.approve',
      'articles.reject',
      'articles.publish',
      'articles.unpublish',
      'articles.schedule',
      'articles.archive',
      'articles.restore',
      'categories.view',
      'categories.update',
      'media.view',
      'media.upload',
      'media.update',
      'comments.view',
      'comments.create',
      'comments.update_own',
      'comments.delete_own',
      'comments.moderate',
      'analytics.view_editorial',
      'users.view',
      'audit.view',
      'newsletter.view',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'editor',
    name: 'editor',
    label: 'Editor',
    description:
      'Reviews assigned articles, requests revisions, validates sources, and approves dispatches within editorial guidelines.',
    isSystem: true,
    priority: 50,
    permissions: [
      'articles.view',
      'articles.view_any',
      'articles.create',
      'articles.update_own',
      'articles.submit',
      'articles.review',
      'articles.approve',
      'articles.reject',
      'articles.schedule',
      'categories.view',
      'media.view',
      'media.upload',
      'comments.view',
      'comments.create',
      'comments.update_own',
      'comments.delete_own',
      'comments.moderate',
      'analytics.view_editorial',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'author',
    name: 'author',
    label: 'Author / Journalist',
    description:
      'Verified newsroom correspondents who compose, edit, and submit eyewitness dispatches and articles for editorial review.',
    isSystem: true,
    priority: 30,
    permissions: [
      'articles.view',
      'articles.create',
      'articles.update_own',
      'articles.delete_own',
      'articles.submit',
      'categories.view',
      'media.view',
      'media.upload',
      'comments.view',
      'comments.create',
      'comments.update_own',
      'comments.delete_own',
      'comments.report',
      'users.update_own',
      'users.export',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'contributor',
    name: 'contributor',
    label: 'Contributor',
    description:
      'Community and guest contributors who draft and submit articles for review. Direct publishing is restricted.',
    isSystem: true,
    priority: 20,
    permissions: [
      'articles.view',
      'articles.create',
      'articles.update_own',
      'articles.submit',
      'categories.view',
      'media.view',
      'media.upload',
      'comments.view',
      'comments.create',
      'comments.update_own',
      'comments.delete_own',
      'comments.report',
      'users.update_own',
      'users.export',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'reader',
    name: 'reader',
    label: 'Reader / Registered User',
    description:
      'Verified platform readers who can bookmark dispatches, leave comments, participate in community notes, and manage privacy.',
    isSystem: true,
    priority: 10,
    permissions: [
      'articles.view',
      'categories.view',
      'media.view',
      'comments.view',
      'comments.create',
      'comments.update_own',
      'comments.delete_own',
      'comments.report',
      'users.update_own',
      'users.delete',
      'users.export',
      'newsletter.view',
      'newsletter.manage',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'guest',
    name: 'guest',
    label: 'Guest / Anonymous Visitor',
    description:
      'Unauthenticated public visitors browsing open news stories, category feeds, and public profiles.',
    isSystem: true,
    priority: 0,
    permissions: [
      'articles.view',
      'categories.view',
      'media.view',
      'comments.view',
      'newsletter.view',
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

/**
 * Normalizes legacy user roles to their modern enterprise equivalents.
 */
export function normalizeRole(role: string | undefined): SystemRole {
  if (!role) return 'guest';
  if (role === 'user') return 'reader';
  if (role === 'moderator') return 'editor';
  if (role === 'journalist') return 'author';
  const match = SYSTEM_ROLES.find((r) => r.id === role || r.name === role);
  return (match?.id as SystemRole) || (role as SystemRole);
}

/**
 * Resolves a RoleDefinition by ID or name, searching custom roles first then system roles.
 */
export function getRoleDefinition(
  roleId: string,
  customRoles: RoleDefinition[] = []
): RoleDefinition {
  const normalizedId = normalizeRole(roleId);
  const custom = customRoles.find((r) => r.id === roleId || r.name === roleId);
  if (custom) return custom;

  const system = SYSTEM_ROLES.find(
    (r) => r.id === normalizedId || r.name === normalizedId || r.id === roleId
  );
  return system || SYSTEM_ROLES.find((r) => r.id === 'reader')!;
}

/**
 * =====================================================================
 * OBJECT-LEVEL AUTHORIZATION CONTEXT
 * =====================================================================
 */
export interface AuthorizationContext {
  resourceAuthorId?: string;
  resourceUserId?: string;
  resourceStatus?: PostStatus;
  scope?: string;
}

/**
 * Centralized authorization check: Evaluates whether a user has permission to perform an action.
 * Enforces Deny by Default, Account Suspension checks, and Resource Ownership.
 */
export function hasPermission(
  user: User | null | undefined,
  permission: PermissionIdentifier,
  context?: AuthorizationContext,
  customRoles: RoleDefinition[] = []
): boolean {
  // 1. Unauthenticated users only possess guest permissions
  if (!user || user.id === 'guest') {
    const guestRole = SYSTEM_ROLES.find((r) => r.id === 'guest')!;
    return guestRole.permissions.includes(permission);
  }

  // 2. Deny by default if the account is suspended or banned
  if (user.status === 'suspended' || user.status === 'banned') {
    return false;
  }

  const roleDef = getRoleDefinition(user.role, customRoles);
  const permissions = roleDef.permissions;

  // 3. Super administrator has global authority
  if (roleDef.id === 'super_admin') {
    return true;
  }

  // 4. Object-Level Resource Ownership checks
  // Article Updates
  if (permission === 'articles.update_own') {
    if (permissions.includes('articles.update_any')) return true;
    if (permissions.includes('articles.update_own')) {
      return Boolean(context?.resourceAuthorId && context.resourceAuthorId === user.id);
    }
    return false;
  }

  // Article Deletion
  if (permission === 'articles.delete_own') {
    if (permissions.includes('articles.delete_any')) return true;
    if (permissions.includes('articles.delete_own')) {
      return Boolean(context?.resourceAuthorId && context.resourceAuthorId === user.id);
    }
    return false;
  }

  // Comment Deletion / Moderation
  if (permission === 'comments.delete_own') {
    if (permissions.includes('comments.moderate')) return true;
    if (permissions.includes('comments.delete_own')) {
      return Boolean(context?.resourceAuthorId && context.resourceAuthorId === user.id);
    }
    return false;
  }

  // User Profile Updates
  if (permission === 'users.update_own') {
    if (permissions.includes('users.update_any')) return true;
    if (permissions.includes('users.update_own')) {
      return Boolean(context?.resourceUserId && context.resourceUserId === user.id);
    }
    return false;
  }

  // Direct permission check
  return permissions.includes(permission);
}

/**
 * Returns a formal HTTP-aligned AuthorizationResult with status code and diagnostic reason.
 */
export function authorizeAction(
  user: User | null | undefined,
  permission: PermissionIdentifier,
  context?: AuthorizationContext,
  customRoles: RoleDefinition[] = []
): AuthorizationResult {
  if (!user || user.id === 'guest') {
    const guestRole = SYSTEM_ROLES.find((r) => r.id === 'guest')!;
    if (guestRole.permissions.includes(permission)) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 401,
      reason: 'Authentication required to access this resource.',
      code: 'UNAUTHENTICATED',
    };
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Your account is suspended or restricted by administrative governance.',
      code: 'ACCOUNT_SUSPENDED',
    };
  }

  const allowed = hasPermission(user, permission, context, customRoles);
  if (!allowed) {
    return {
      allowed: false,
      statusCode: 403,
      reason: `Forbidden: User role [${user.role}] does not hold the required [${permission}] permission or lacks resource ownership.`,
      code: 'INSUFFICIENT_PERMISSIONS',
    };
  }

  return { allowed: true, statusCode: 200 };
}

/**
 * =====================================================================
 * EDITORIAL APPROVAL WORKFLOW ENGINE
 * =====================================================================
 * DRAFT -> PENDING_REVIEW -> UNDER_REVIEW -> APPROVED -> PUBLISHED
 * Separation of Duties: Author cannot approve their own submission!
 */
export function canTransitionWorkflow(
  user: User,
  article: NewsPost,
  targetStatus: PostStatus,
  customRoles: RoleDefinition[] = []
): AuthorizationResult {
  if (user.status === 'suspended' || user.status === 'banned') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Suspended user cannot perform editorial transitions.',
      code: 'ACCOUNT_SUSPENDED',
    };
  }

  const roleDef = getRoleDefinition(user.role, customRoles);
  const isSuperAdmin = roleDef.id === 'super_admin';
  const isOwnArticle = article.authorId === user.id;

  // 1. Submit Draft for Review: DRAFT -> PENDING_REVIEW
  if (targetStatus === 'pending_review') {
    if (
      hasPermission(user, 'articles.submit', { resourceAuthorId: article.authorId }, customRoles) ||
      (isOwnArticle && (user.role === 'author' || user.role === 'contributor'))
    ) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Only the author or authorized editor can submit a draft for review.',
      code: 'SUBMISSION_FORBIDDEN',
    };
  }

  // 2. Begin Editorial Review: PENDING_REVIEW -> UNDER_REVIEW
  if (targetStatus === 'under_review') {
    if (hasPermission(user, 'articles.review', undefined, customRoles)) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [articles.review] permission to begin editorial review.',
      code: 'REVIEW_FORBIDDEN',
    };
  }

  // 3. Request Revisions: UNDER_REVIEW -> REVISION_REQUESTED
  if (targetStatus === 'revision_requested') {
    if (hasPermission(user, 'articles.review', undefined, customRoles)) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [articles.review] permission to request revisions.',
      code: 'REVISION_FORBIDDEN',
    };
  }

  // 4. Reject Submission: UNDER_REVIEW -> REJECTED
  if (targetStatus === 'rejected') {
    if (
      hasPermission(user, 'articles.reject', undefined, customRoles) ||
      hasPermission(user, 'articles.review', undefined, customRoles)
    ) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [articles.reject] permission to reject article submission.',
      code: 'REJECTION_FORBIDDEN',
    };
  }

  // 5. Approve Content: UNDER_REVIEW / PENDING_REVIEW -> APPROVED
  if (targetStatus === 'approved') {
    if (!hasPermission(user, 'articles.approve', undefined, customRoles)) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Missing [articles.approve] permission to approve this article.',
        code: 'APPROVAL_FORBIDDEN',
      };
    }

    // MANDATORY SEPARATION OF DUTIES: An author cannot approve their own submission!
    if (isOwnArticle && !isSuperAdmin) {
      return {
        allowed: false,
        statusCode: 403,
        reason:
          'Separation of duties violation: An author cannot approve or sign off on their own article submission.',
        code: 'SEPARATION_OF_DUTIES_VIOLATION',
      };
    }

    return { allowed: true, statusCode: 200 };
  }

  // 6. Schedule Content: APPROVED -> SCHEDULED
  if (targetStatus === 'scheduled') {
    if (hasPermission(user, 'articles.schedule', undefined, customRoles)) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [articles.schedule] permission to schedule publication.',
      code: 'SCHEDULE_FORBIDDEN',
    };
  }

  // 7. Publish to Live News Wire: APPROVED / SCHEDULED -> PUBLISHED
  if (targetStatus === 'published' || targetStatus === 'pinned_breaking') {
    if (hasPermission(user, 'articles.publish', undefined, customRoles)) {
      // Authors who lack editorial sign-off cannot self-publish unapproved drafts
      if (
        isOwnArticle &&
        !isSuperAdmin &&
        article.status !== 'approved' &&
        article.status !== 'scheduled' &&
        user.role !== 'admin' &&
        user.role !== 'managing_editor'
      ) {
        return {
          allowed: false,
          statusCode: 403,
          reason:
            'Separation of duties: Articles must be formally approved by an independent editor before publication.',
          code: 'UNAPPROVED_PUBLICATION_BLOCKED',
        };
      }
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [articles.publish] permission to publish live dispatches.',
      code: 'PUBLISH_FORBIDDEN',
    };
  }

  // 8. Unpublish / Archive: PUBLISHED -> UNPUBLISHED / ARCHIVED
  if (targetStatus === 'unpublished' || targetStatus === 'archived' || targetStatus === 'draft') {
    if (
      hasPermission(user, 'articles.unpublish', undefined, customRoles) ||
      hasPermission(user, 'articles.archive', undefined, customRoles) ||
      (isOwnArticle && article.status === 'draft')
    ) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing permission to unpublish or archive live articles.',
      code: 'UNPUBLISH_FORBIDDEN',
    };
  }

  // Default fallback for disputed/removed moderation actions
  if (targetStatus === 'disputed' || targetStatus === 'removed') {
    if (hasPermission(user, 'articles.update_any', undefined, customRoles)) {
      return { allowed: true, statusCode: 200 };
    }
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Administrative moderation privilege required.',
      code: 'MODERATION_FORBIDDEN',
    };
  }

  return {
    allowed: false,
    statusCode: 422,
    reason: `Invalid or unsupported workflow transition to [${targetStatus}].`,
    code: 'INVALID_TRANSITION',
  };
}

/**
 * =====================================================================
 * ROLE & PRIVILEGE ESCALATION DEFENSE ENGINE
 * =====================================================================
 */

/**
 * Validates whether currentUser is authorized to assign targetRoleId to targetUser.
 * Prevents privilege escalation and prevents removal of the last Super Administrator.
 */
export function validateRoleAssignment(
  currentUser: User,
  targetUser: User,
  targetRoleId: string,
  allUsers: User[],
  customRoles: RoleDefinition[] = []
): AuthorizationResult {
  const actorRoleDef = getRoleDefinition(currentUser.role, customRoles);
  const targetRoleDef = getRoleDefinition(targetRoleId, customRoles);

  // 1. Only administrators can assign roles
  if (
    !hasPermission(currentUser, 'roles.assign', undefined, customRoles) &&
    actorRoleDef.id !== 'super_admin' &&
    actorRoleDef.id !== 'admin'
  ) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [roles.assign] permission to assign user roles.',
      code: 'ASSIGN_ROLE_FORBIDDEN',
    };
  }

  // 2. Privilege Escalation Prevention: An admin cannot assign a role higher or equal to their own priority
  if (actorRoleDef.id !== 'super_admin' && targetRoleDef.priority >= actorRoleDef.priority) {
    return {
      allowed: false,
      statusCode: 403,
      reason: `Privilege escalation blocked: Cannot assign role [${targetRoleDef.label}] with equal or higher priority than your current role [${actorRoleDef.label}].`,
      code: 'PRIVILEGE_ESCALATION_BLOCKED',
    };
  }

  // 3. Non-Super-Admins cannot modify or reassign another Super Administrator
  const currentTargetRole = getRoleDefinition(targetUser.role, customRoles);
  if (actorRoleDef.id !== 'super_admin' && currentTargetRole.id === 'super_admin') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Only a Super Administrator can modify privileges of a Super Administrator.',
      code: 'SUPER_ADMIN_IMMUTABLE',
    };
  }

  // 4. CRITICAL GOVERNANCE SAFEGUARD: Prevent accidental removal of the last active Super Administrator
  if (
    (targetUser.role === 'super_admin' || targetUser.role === 'admin') &&
    targetRoleId !== 'super_admin' &&
    targetRoleId !== 'admin'
  ) {
    const activeSuperAdmins = allUsers.filter(
      (u) =>
        u.id !== targetUser.id &&
        (u.role === 'super_admin' || u.role === 'admin') &&
        u.status === 'active'
    );
    if (activeSuperAdmins.length === 0) {
      return {
        allowed: false,
        statusCode: 422,
        reason:
          'Governance safety restriction: Cannot revoke administrative privileges from the platform’s last active Super Administrator.',
        code: 'LAST_SUPER_ADMIN_PROTECTED',
      };
    }
  }

  return { allowed: true, statusCode: 200 };
}

/**
 * Validates deletion of custom roles. Protects system roles and ensures referential integrity.
 */
export function validateRoleDeletion(
  currentUser: User,
  roleId: string,
  allUsers: User[],
  customRoles: RoleDefinition[] = []
): AuthorizationResult {
  const actorRoleDef = getRoleDefinition(currentUser.role, customRoles);

  if (!hasPermission(currentUser, 'roles.delete', undefined, customRoles)) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [roles.delete] permission.',
      code: 'DELETE_ROLE_FORBIDDEN',
    };
  }

  const roleToDelete = getRoleDefinition(roleId, customRoles);

  // 1. Protected System Roles cannot be deleted
  if (roleToDelete.isSystem) {
    return {
      allowed: false,
      statusCode: 403,
      reason: `Protected system role [${roleToDelete.label}] cannot be deleted.`,
      code: 'SYSTEM_ROLE_PROTECTED',
    };
  }

  // 2. Referential integrity: Role cannot be deleted if assigned to active users
  const assignedUsers = allUsers.filter((u) => u.role === roleId);
  if (assignedUsers.length > 0) {
    return {
      allowed: false,
      statusCode: 422,
      reason: `Cannot delete role [${roleToDelete.label}] because it is currently assigned to ${assignedUsers.length} user(s). Reassign them first.`,
      code: 'ROLE_IN_USE',
    };
  }

  // 3. Priority check
  if (actorRoleDef.id !== 'super_admin' && roleToDelete.priority >= actorRoleDef.priority) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Cannot delete a role with equal or higher priority than your own.',
      code: 'PRIORITY_RESTRICTION',
    };
  }

  return { allowed: true, statusCode: 200 };
}

/**
 * Validates creation of a custom role.
 */
export function validateRoleCreation(
  currentUser: User,
  newRoleData: Partial<RoleDefinition>,
  existingRoles: RoleDefinition[]
): AuthorizationResult {
  if (!hasPermission(currentUser, 'roles.create', undefined, existingRoles)) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Missing [roles.create] permission to create custom roles.',
      code: 'CREATE_ROLE_FORBIDDEN',
    };
  }

  if (!newRoleData.name || !newRoleData.label) {
    return {
      allowed: false,
      statusCode: 422,
      reason: 'Role name and display label are required.',
      code: 'INVALID_INPUT',
    };
  }

  const normalizedName = newRoleData.name.trim().toLowerCase().replace(/\s+/g, '_');
  const duplicate = existingRoles.find(
    (r) => r.name.toLowerCase() === normalizedName || r.id === normalizedName
  );
  if (duplicate) {
    return {
      allowed: false,
      statusCode: 422,
      reason: `Role with identifier "${normalizedName}" already exists.`,
      code: 'DUPLICATE_ROLE',
    };
  }

  // Boundary check: cannot grant permissions that actor does not possess
  const actorRoleDef = getRoleDefinition(currentUser.role, existingRoles);
  if (actorRoleDef.id !== 'super_admin') {
    const actorPermissions = new Set(actorRoleDef.permissions);
    const excessivePermissions = (newRoleData.permissions || []).filter(
      (p) => !actorPermissions.has(p)
    );
    if (excessivePermissions.length > 0) {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Delegation boundary violation: Cannot grant permissions you do not possess: [${excessivePermissions.join(
          ', '
        )}]`,
        code: 'DELEGATION_BOUNDARY_EXCEEDED',
      };
    }
  }

  return { allowed: true, statusCode: 200 };
}
