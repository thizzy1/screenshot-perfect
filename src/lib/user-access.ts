export type UserBanProfile = {
  is_banned?: boolean | null;
  ban_reason?: string | null;
  status?: string | null;
};

export function isUserBanned(profile?: UserBanProfile | null): boolean {
  if (!profile) return false;
  if (profile.is_banned === true) return true;
  if (typeof profile.status === 'string' && profile.status.toLowerCase() !== 'active') return true;
  return false;
}

export function bannedReason(profile?: UserBanProfile | null): string {
  if (!profile) return 'Akun Anda diblokir karena melanggar ketentuan layanan.';
  const reason = typeof profile.ban_reason === 'string' && profile.ban_reason.trim()
    ? profile.ban_reason.trim()
    : 'Pelanggaran ketentuan layanan';
  return `Akun Anda telah diblokir karena ${reason}.`;
}
