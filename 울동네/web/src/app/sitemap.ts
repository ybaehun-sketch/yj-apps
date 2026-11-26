import type { MetadataRoute } from 'next';
import { fetchPublishedBlogPosts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://wooldongne.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4
    }
  ];

  try {
    const { posts } = await fetchPublishedBlogPosts({ page: 1, pageSize: 500 });
    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${BASE_URL}/posts/${post.id}`,
      lastModified: new Date(post.blog_published_at || post.created_at),
      changeFrequency: 'weekly',
      priority: 0.8
    }));
    return [...staticRoutes, ...postRoutes];
  } catch {
    return staticRoutes;
  }
}
