import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    externalLink: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Research papers & books I'm reading. One entry per markdown file.
const reading = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // 'paper' or 'book' — controls which section it shows under.
    kind: z.enum(['paper', 'book']),
    authors: z.string().optional(),
    year: z.coerce.number().optional(),
    // where to read it (arxiv/doi/publisher). optional for physical books.
    link: z.string().optional(),
    status: z.enum(['reading', 'done', 'queued']).default('queued'),
    // short personal take, shown inline. body of the file is optional long notes.
    note: z.string().optional(),
    addedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, reading };