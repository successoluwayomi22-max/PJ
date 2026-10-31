import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
  getRoleDefinition,
  hasPermission,
  authorizeAction,
  canTransitionWorkflow,
  validateRoleAssignment,
  validateRoleCreation,
  validateRoleDeletion,
} from '../utils/rbac.ts';
import type { NewsPost, RoleDefinition, User } from '../types.ts';

// Test Fixtures
const superAdminUser: User = {
  id: 'user-super',
  username: 'elena_super',
  displayName: 'Elena Vance (Super Admin)',
  email: 'elena@pulsenews.global',
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Super Admin',
  location: 'HQ',
  role: 'super_admin',
  status: 'active',
  verificationTier: 'news_organization',
  trustScore: 0.99,
  joinedAt: '2025-01-01',
  followersCount: 1000,
  reportsCount: 50,
};

const adminUser: User = {
  id: 'user-admin',
  username: 'marcus_admin',
  displayName: 'Marcus Admin',
  email: 'admin@pulsenews.global',
  avatarUrl: 'https://example.com/admin.jpg',
  bio: 'Platform Admin',
  location: 'London',
  role: 'admin',
  status: 'active',
  verificationTier: 'news_organization',
  trustScore: 0.95,
  joinedAt: '2025-01-01',
  followersCount: 500,
  reportsCount: 20,
};

const managingEditorUser: User = {
  id: 'user-managing-ed',
  username: 'claire_me',
  displayName: 'Claire Managing Editor',
  email: 'claire@pulsenews.global',
  avatarUrl: 'https://example.com/me.jpg',
  bio: 'Managing Editor',
  location: 'Paris',
  role: 'managing_editor',
  status: 'active',
  verificationTier: 'journalist',
  trustScore: 0.93,
  joinedAt: '2025-01-01',
  followersCount: 800,
  reportsCount: 40,
};

const editorUser: User = {
  id: 'user-editor',
  username: 'sarah_ed',
  displayName: 'Sarah Editor',
  email: 'sarah@pulsenews.global',
  avatarUrl: 'https://example.com/ed.jpg',
  bio: 'Staff Editor',
  location: 'Berlin',
  role: 'editor',
  status: 'active',
  verificationTier: 'journalist',
  trustScore: 0.92,
  joinedAt: '2025-02-01',
  followersCount: 300,
  reportsCount: 15,
};

const authorUser: User = {
  id: 'user-author-1',
  username: 'kenji_writer',
  displayName: 'Kenji Takahashi',
  email: 'kenji@tokyo.jp',
  avatarUrl: 'https://example.com/kenji.jpg',
  bio: 'Correspondent',
  location: 'Tokyo',
  role: 'author',
  status: 'active',
  verificationTier: 'journalist',
  trustScore: 0.96,
  joinedAt: '2025-03-01',
  followersCount: 12000,
  reportsCount: 140,
};

const contributorUser: User = {
  id: 'user-contrib',
  username: 'guest_writer',
  displayName: 'Alex Guest',
  email: 'alex@freelance.org',
  avatarUrl: 'https://example.com/alex.jpg',
  bio: 'Guest Contributor',
  location: 'Rome',
  role: 'contributor',
  status: 'active',
  verificationTier: 'verified_citizen',
  trustScore: 0.85,
  joinedAt: '2025-05-01',
  followersCount: 100,
  reportsCount: 5,
};

const readerUser: User = {
  id: 'user-reader-1',
  username: 'amina_reader',
  displayName: 'Amina Reader',
  email: 'amina@reader.net',
  avatarUrl: 'https://example.com/amina.jpg',
  bio: 'Avid Reader',
  location: 'Lagos',
  role: 'reader',
  status: 'active',
  verificationTier: 'standard',
  trustScore: 0.7,
  joinedAt: '2025-06-01',
  followersCount: 50,
  reportsCount: 0,
};

const suspendedUser: User = {
  ...readerUser,
  id: 'user-suspended',
  username: 'banned_bot',
  status: 'suspended',
};

const sampleArticle: NewsPost = {
  id: 'post-101',
  authorId: 'user-author-1',
  headline: 'Breakthrough in Quantum Telemetry',
  bodyText: 'Extensive report on recent quantum experiments.',
  aiSummary: ['Quantum test complete'],
  category: 'tech',
  status: 'draft',
  tags: ['#quantum', '#tech'],
  isEyewitness: true,
  isBreakingPinned: false,
  locationName: 'Tokyo, Japan',
  latitude: 35.6762,
  longitude: 139.6503,
  privacyLevel: 'city',
  media: [],
  upvotes: 0,
  downvotes: 0,
  commentCount: 0,
  viewCount: 0,
  shareCount: 0,
  velocityPer15m: 0,
  createdAt: new Date().toISOString(),
  forensics: {
    authenticityScore: 98,
    exifVerified: true,
    gpsWeatherMatch: true,
    deepfakeProbability: 1,
    recycledFootageCheck: 'Original Capture',
    deviceSignature: 'C2PA-Signed',
  },
};

test('RBAC-1: System Role Hierarchy & Permissions Completeness', () => {
  assert.strictEqual(SYSTEM_ROLES.length, 8);
  const superAdmin = getRoleDefinition('super_admin');
  assert.strictEqual(superAdmin.priority, 100);
  assert.strictEqual(superAdmin.permissions.length, ALL_PERMISSIONS.length);

  const guest = getRoleDefinition('guest');
  assert.strictEqual(guest.priority, 0);
  assert.strictEqual(guest.permissions.includes('settings.update'), false);
  assert.strictEqual(guest.permissions.includes('articles.create'), false);
  assert.strictEqual(guest.permissions.includes('articles.view'), true);
});

test('RBAC-2: Deny by Default for Suspended and Banned Accounts', () => {
  const result = authorizeAction(suspendedUser, 'articles.view');
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.statusCode, 403);
  assert.strictEqual(result.code, 'ACCOUNT_SUSPENDED');

  const perm = hasPermission(suspendedUser, 'comments.create');
  assert.strictEqual(perm, false);
});

test('RBAC-3: Guest & Unauthenticated Access Enforcement', () => {
  // Can read public articles
  assert.strictEqual(hasPermission(null, 'articles.view'), true);
  // Cannot create articles
  assert.strictEqual(hasPermission(null, 'articles.create'), false);
  // AuthorizeAction returns 401 for protected endpoints
  const authRes = authorizeAction(null, 'articles.create');
  assert.strictEqual(authRes.allowed, false);
  assert.strictEqual(authRes.statusCode, 401);
});

test('RBAC-4: Resource Ownership Verification & IDOR Protection', () => {
  // Author can update their own article
  const ownRes = hasPermission(authorUser, 'articles.update_own', {
    resourceAuthorId: authorUser.id,
  });
  assert.strictEqual(ownRes, true);

  // Author CANNOT update another author's article
  const idorRes = hasPermission(authorUser, 'articles.update_own', {
    resourceAuthorId: 'user-another-author',
  });
  assert.strictEqual(idorRes, false);

  // Reader can delete their own comment
  const commentOwn = hasPermission(readerUser, 'comments.delete_own', {
    resourceAuthorId: readerUser.id,
  });
  assert.strictEqual(commentOwn, true);

  // Reader CANNOT delete another user's comment
  const commentOther = hasPermission(readerUser, 'comments.delete_own', {
    resourceAuthorId: 'user-somebody-else',
  });
  assert.strictEqual(commentOther, false);

  // Admin holding comments.moderate CAN delete any comment
  const adminMod = hasPermission(adminUser, 'comments.delete_own', {
    resourceAuthorId: 'user-somebody-else',
  });
  assert.strictEqual(adminMod, true);
});

test('RBAC-5: Editorial Workflow Transitions — Submission & Review', () => {
  // Author submits own draft -> pending_review
  const submitRes = canTransitionWorkflow(authorUser, sampleArticle, 'pending_review');
  assert.strictEqual(submitRes.allowed, true);

  // Random reader CANNOT submit someone else's draft
  const readerSubmit = canTransitionWorkflow(readerUser, sampleArticle, 'pending_review');
  assert.strictEqual(readerSubmit.allowed, false);

  // Editor transitions pending_review -> under_review
  const underReviewArticle = { ...sampleArticle, status: 'pending_review' as const };
  const reviewRes = canTransitionWorkflow(editorUser, underReviewArticle, 'under_review');
  assert.strictEqual(reviewRes.allowed, true);
});

test('RBAC-6: Editorial Workflow — Mandatory Separation of Duties on Approval', () => {
  const underReviewArticle: NewsPost = { ...sampleArticle, status: 'under_review' as const };

  // Independent Editor approves author's article -> PASS
  const editorApproval = canTransitionWorkflow(editorUser, underReviewArticle, 'approved');
  assert.strictEqual(editorApproval.allowed, true);
  assert.strictEqual(editorApproval.statusCode, 200);

  // CRITICAL: Author attempting to approve their OWN article -> VIOLATION BLOCKED
  const selfApproval = canTransitionWorkflow(authorUser, underReviewArticle, 'approved');
  assert.strictEqual(selfApproval.allowed, false);
  assert.strictEqual(selfApproval.statusCode, 403);
  assert.strictEqual(selfApproval.code, 'APPROVAL_FORBIDDEN');

  // Even if author is also assigned editor role, author cannot approve own submission
  const authorWithEditorRole: User = { ...authorUser, role: 'editor' };
  const conflictApproval = canTransitionWorkflow(
    authorWithEditorRole,
    underReviewArticle,
    'approved'
  );
  assert.strictEqual(conflictApproval.allowed, false);
  assert.strictEqual(conflictApproval.statusCode, 403);
  assert.strictEqual(conflictApproval.code, 'SEPARATION_OF_DUTIES_VIOLATION');
});

test('RBAC-7: Publishing Live News Wire Gatekeeping', () => {
  const approvedArticle: NewsPost = { ...sampleArticle, status: 'approved' as const };

  // Managing Editor can publish approved article
  const pubRes = canTransitionWorkflow(managingEditorUser, approvedArticle, 'published');
  assert.strictEqual(pubRes.allowed, true);

  // Contributor or Reader CANNOT publish approved article
  const readerPub = canTransitionWorkflow(readerUser, approvedArticle, 'published');
  assert.strictEqual(readerPub.allowed, false);
  assert.strictEqual(readerPub.code, 'PUBLISH_FORBIDDEN');
});

test('RBAC-8: Privilege Escalation Prevention on Role Assignment', () => {
  const allUsers = [superAdminUser, adminUser, authorUser, readerUser];

  // Admin attempting to assign super_admin to reader -> BLOCKED
  const escalateRes = validateRoleAssignment(adminUser, readerUser, 'super_admin', allUsers);
  assert.strictEqual(escalateRes.allowed, false);
  assert.strictEqual(escalateRes.statusCode, 403);
  assert.strictEqual(escalateRes.code, 'PRIVILEGE_ESCALATION_BLOCKED');

  // Super Admin assigning editor to reader -> ALLOWED
  const validRes = validateRoleAssignment(superAdminUser, readerUser, 'editor', allUsers);
  assert.strictEqual(validRes.allowed, true);
});

test('RBAC-9: Governance Safeguard — Protection of Last Super Administrator', () => {
  // Only 1 super admin in the system
  const singleAdminSystem = [superAdminUser, authorUser, readerUser];

  // Attempting to demote the sole super admin to reader -> BLOCKED
  const demoteRes = validateRoleAssignment(
    superAdminUser,
    superAdminUser,
    'reader',
    singleAdminSystem
  );
  assert.strictEqual(demoteRes.allowed, false);
  assert.strictEqual(demoteRes.statusCode, 422);
  assert.strictEqual(demoteRes.code, 'LAST_SUPER_ADMIN_PROTECTED');

  // When a second super admin exists, demotion is allowed
  const secondSuperAdmin: User = { ...superAdminUser, id: 'user-super-2' };
  const dualAdminSystem = [superAdminUser, secondSuperAdmin, authorUser];
  const allowedDemotion = validateRoleAssignment(
    superAdminUser,
    superAdminUser,
    'reader',
    dualAdminSystem
  );
  assert.strictEqual(allowedDemotion.allowed, true);
});

test('RBAC-10: Custom Role Creation & Boundary Safeguards', () => {
  const customRoleData: Partial<RoleDefinition> = {
    name: 'fact_checker_lead',
    label: 'Lead Fact Checker',
    permissions: ['articles.view', 'articles.review'],
  };

  // Super Admin can create custom role
  const createRes = validateRoleCreation(superAdminUser, customRoleData, SYSTEM_ROLES);
  assert.strictEqual(createRes.allowed, true);

  // Editor attempting to create a custom role with permissions they do NOT have -> BLOCKED
  const excessiveRole: Partial<RoleDefinition> = {
    name: 'rogue_admin',
    label: 'Rogue Admin',
    permissions: ['settings.security.manage', 'users.manage_roles'],
  };
  const editorCreateRes = validateRoleCreation(editorUser, excessiveRole, SYSTEM_ROLES);
  assert.strictEqual(editorCreateRes.allowed, false);
  assert.strictEqual(editorCreateRes.statusCode, 403);
  assert.strictEqual(editorCreateRes.code, 'CREATE_ROLE_FORBIDDEN');
});

test('RBAC-11: System Protected Roles Deletion Prevention', () => {
  const allUsers = [superAdminUser, authorUser];

  // Attempting to delete protected system role 'admin' -> BLOCKED
  const deleteSystemRole = validateRoleDeletion(superAdminUser, 'admin', allUsers, SYSTEM_ROLES);
  assert.strictEqual(deleteSystemRole.allowed, false);
  assert.strictEqual(deleteSystemRole.statusCode, 403);
  assert.strictEqual(deleteSystemRole.code, 'SYSTEM_ROLE_PROTECTED');

  // Attempting to delete custom role assigned to an active user -> BLOCKED
  const customRole: RoleDefinition = {
    id: 'custom_curator',
    name: 'custom_curator',
    label: 'Curator',
    description: 'Curates feeds',
    isSystem: false,
    priority: 15,
    permissions: ['articles.view'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const userWithCustomRole: User = { ...readerUser, role: 'custom_curator' };
  const deleteInUse = validateRoleDeletion(
    superAdminUser,
    'custom_curator',
    [userWithCustomRole],
    [...SYSTEM_ROLES, customRole]
  );
  assert.strictEqual(deleteInUse.allowed, false);
  assert.strictEqual(deleteInUse.statusCode, 422);
  assert.strictEqual(deleteInUse.code, 'ROLE_IN_USE');
});
