import { elastic, EMAIL_INDEX } from './client';

export async function searchEmails(userId: string, q: string, status: string | undefined, page: number, limit: number): Promise<{ ids: string[]; total: number }> {
  const result = await elastic.search({ index: EMAIL_INDEX, from: (page - 1) * limit, size: limit, query: { bool: {
    must: q ? [{ multi_match: { query: q, fields: ['toEmail', 'subject', 'body'] } }] : [{ match_all: {} }],
    filter: [{ term: { userId } }, ...(status ? [{ term: { status } }] : [])],
  } } });
  return {
    ids: result.hits.hits.map((hit) => hit._id).filter((id): id is string => id !== undefined),
    total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
  };
}
