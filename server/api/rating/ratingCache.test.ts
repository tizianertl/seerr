import IMDBRadarrProxy from '@server/api/rating/imdbRadarrProxy';
import RottenTomatoes from '@server/api/rating/rottentomatoes';
import { CARD_RATING_CACHE_TTL_SECONDS } from '@server/constants/rating';
import cacheManager from '@server/lib/cache';
import type { AxiosInstance } from 'axios';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

const getAxios = (api: unknown): AxiosInstance =>
  (api as { axios: AxiosInstance }).axios;

const assertConfiguredTtl = (cacheId: 'imdb' | 'rt') => {
  const cache = cacheManager.getCache(cacheId).data;
  assert.strictEqual(cache.keys().length, 1);

  const expiresAt = cache.getTtl(cache.keys()[0]);
  assert.ok(expiresAt);

  const remainingTtl = (expiresAt - Date.now()) / 1000;
  assert.ok(
    remainingTtl > CARD_RATING_CACHE_TTL_SECONDS - 5,
    `expected approximately ${CARD_RATING_CACHE_TTL_SECONDS}s, got ${remainingTtl}s`
  );
};

describe('card rating provider caching', () => {
  beforeEach(() => {
    cacheManager.getCache('imdb').flush();
    cacheManager.getCache('rt').flush();
  });

  afterEach(() => {
    mock.restoreAll();
    cacheManager.getCache('imdb').flush();
    cacheManager.getCache('rt').flush();
  });

  it('caches IMDb responses for the configured rating TTL', async () => {
    const imdb = new IMDBRadarrProxy();
    const get = mock.method(getAxios(imdb), 'get', async () => ({
      data: [
        {
          ImdbId: 'tt0480249',
          Title: 'I Am Legend',
          MovieRatings: {
            Imdb: { Count: 850_000, Value: 7.2 },
          },
        },
      ],
    }));

    await imdb.getMovieRatings('tt0480249');
    await imdb.getMovieRatings('tt0480249');

    assert.strictEqual(get.mock.callCount(), 1);
    assertConfiguredTtl('imdb');
  });

  it('caches Rotten Tomatoes responses for the configured rating TTL', async () => {
    const rt = new RottenTomatoes();
    const post = mock.method(getAxios(rt), 'post', async () => ({
      data: {
        results: [
          {
            index: 'content_rt',
            hits: [
              {
                title: 'I Am Legend',
                releaseYear: 2007,
                vanity: 'i_am_legend',
                rottenTomatoes: {
                  audienceScore: 68,
                  criticsScore: 68,
                  certifiedFresh: false,
                },
              },
            ],
          },
        ],
      },
    }));

    await rt.getMovieRatings('I Am Legend', 2007);
    await rt.getMovieRatings('I Am Legend', 2007);

    assert.strictEqual(post.mock.callCount(), 1);
    assertConfiguredTtl('rt');
  });
});
