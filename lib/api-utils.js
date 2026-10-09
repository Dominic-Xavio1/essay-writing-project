import { NextResponse } from 'next/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function calcReadTime(content) {
  if (typeof content !== 'string') return 1;
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
