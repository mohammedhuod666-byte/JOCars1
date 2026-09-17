'use client';

import { useState } from 'react';

/**
 * Avatar image that never shows a broken-image icon or spilling alt text:
 * if the URL fails to load it falls back to the user's initial letter.
 * Also normalizes absolute same-site /uploads URLs to relative paths so
 * avatars keep working when the public domain/tunnel changes.
 */
export function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    if (url.startsWith('/')) return url;
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname;
    return url;
  } catch {
    return url;
  }
}

interface Props {
  src?: string | null;
  name?: string | null;
  className?: string;
}

export function SafeAvatar({ src, name, className }: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveAvatarUrl(src);

  if (!resolved || failed) {
    return <span className={className}>{name?.charAt(0) || '?'}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={name || ''}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
