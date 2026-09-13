import { NextResponse } from 'next/server';

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
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
