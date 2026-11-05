export type ExpiryStatus = 'none' | 'expired' | 'expiring_soon' | 'valid';

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(isoDate: string | null): Date {
  if (!isoDate) {
    return new Date();
  }
  const parts = isoDate.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(isoDate);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDisplayDate(isoDate: string | null): string {
  if (!isoDate) {
    return 'Not set';
  }
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getExpiryStatus(isoDate: string | null): {
  status: ExpiryStatus;
  label: string;
} {
  if (!isoDate) {
    return { status: 'none', label: 'No expiry date' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = parseIsoDate(isoDate);
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  const diffMs = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      status: 'expired',
      label: daysAgo === 1 ? 'Expired yesterday' : `Expired ${daysAgo}d ago`,
    };
  }

  if (diffDays === 0) {
    return { status: 'expiring_soon', label: 'Expires today' };
  }

  if (diffDays <= 30) {
    return {
      status: 'expiring_soon',
      label: `Expires in ${diffDays}d`,
    };
  }

  return {
    status: 'valid',
    label: formatDisplayDate(isoDate),
  };
}

