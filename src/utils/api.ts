import * as firestoreService from './firestoreService';

export const getStoredToken = firestoreService.getStoredToken;
export const setStoredToken = firestoreService.setStoredToken;
export const clearStoredToken = firestoreService.clearStoredToken;
export const getCachedUser = firestoreService.getCachedUser;
export const setCachedUser = firestoreService.setCachedUser;
export const ensureFirestoreSeeded = firestoreService.ensureFirestoreSeeded;

export const api = {
  // Auth
  getDemoUsers: firestoreService.getDemoUsers,
  demoLogin: firestoreService.demoLogin,
  login: firestoreService.login,
  register: firestoreService.register,
  getMe: firestoreService.getMe,
  updateProfile: firestoreService.updateProfile,
  searchUsers: firestoreService.searchUsers,

  // Schedulers
  getSchedulers: firestoreService.getSchedulers,
  createScheduler: firestoreService.createScheduler,
  updateScheduler: firestoreService.updateScheduler,
  deleteScheduler: firestoreService.deleteScheduler,
  inviteMember: firestoreService.inviteMember,
  updateMemberRole: firestoreService.updateMemberRole,
  removeMember: firestoreService.removeMember,

  // Invitations
  getInvitations: firestoreService.getInvitations,
  respondInvitation: firestoreService.respondInvitation,

  // Schedules
  getSchedules: firestoreService.getSchedules,
  createSchedule: firestoreService.createSchedule,
  updateSchedule: firestoreService.updateSchedule,
  deleteSchedule: firestoreService.deleteSchedule,

  // Admin
  getAdminStats: firestoreService.getAdminStats,
  getAdminUsers: firestoreService.getAdminUsers,
  updateAdminUser: firestoreService.updateAdminUser,
  deleteAdminUser: firestoreService.deleteAdminUser,
  getAdminSchedulers: firestoreService.getAdminSchedulers,
  deleteAdminScheduler: firestoreService.deleteAdminScheduler,
};
