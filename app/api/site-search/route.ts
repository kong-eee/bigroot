import { NextResponse } from 'next/server';
import { searchSiteIndex } from '@/lib/site-search';
import { createAdminSupabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 30);

  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const pageResults = searchSiteIndex(q, limit);

  const communityResults: typeof pageResults = [];
  const admin = createAdminSupabase();
  if (admin && q.length >= 2) {
    const pattern = `%${q.replace(/[%_]/g, '')}%`;
    const { data: posts } = await admin
      .from('posts')
      .select('id, title, content, category')
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(8);

    for (const post of posts ?? []) {
      const text = `${post.title ?? ''} ${post.content ?? ''}`.trim();
      communityResults.push({
        id: `community-${post.id}`,
        pageLabel: '커뮤니티',
        section: post.category ? `게시글 · ${post.category}` : '게시글',
        snippet: text.slice(0, 120) + (text.length > 120 ? '…' : ''),
        href: `/community?post=${post.id}`,
        source: 'community',
        score: 6,
      });
    }
  }

  const merged = [...pageResults, ...communityResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ results: merged });
}
