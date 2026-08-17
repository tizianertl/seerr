import assert from 'node:assert/strict';
import { before, beforeEach, describe, it, mock } from 'node:test';

import ExternalAPI from '@server/api/externalapi';
import type { Express } from 'express';
import express from 'express';
import request from 'supertest';
import movieRoutes from './movie';

const externalGetMock = mock.method(
  ExternalAPI.prototype as unknown as {
    get: (endpoint: string) => Promise<unknown>;
  },
  'get'
);

const tmdbMovie = {
  title: 'I Am Legend',
  imdb_id: 'tt0480249',
  videos: { results: [] },
};

const imdbMovie = {
  ImdbId: 'tt0480249',
  Title: 'I Am Legend',
  MovieRatings: {
    Imdb: {
      Count: 850000,
      Value: 7.2,
    },
  },
};

let app: Express;

function createApp() {
  const app = express();
  app.use('/movie', movieRoutes);
  app.use(
    (
      err: { status?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      res
        .status(err.status ?? 500)
        .json({ status: err.status ?? 500, message: err.message });
    }
  );
  return app;
}

before(() => {
  app = createApp();
});

beforeEach(() => {
  externalGetMock.mock.resetCalls();
  externalGetMock.mock.mockImplementation(async (endpoint) => {
    if (endpoint === '/movie/337401') {
      return tmdbMovie;
    }

    if (endpoint === '/movie/imdb/tt0480249') {
      return [imdbMovie];
    }

    throw new Error(`Unexpected API request: ${endpoint}`);
  });
});

describe('GET /movie/:id/ratings/imdb', () => {
  it('returns the IMDb rating for a TMDB movie ID', async () => {
    const res = await request(app).get('/movie/337401/ratings/imdb');

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, {
      title: 'I Am Legend',
      url: 'https://www.imdb.com/title/tt0480249',
      criticsScore: 7.2,
      criticsScoreCount: 850000,
    });
    assert.strictEqual(externalGetMock.mock.callCount(), 2);
  });

  it('returns 404 without requesting IMDb when no IMDb ID exists', async () => {
    externalGetMock.mock.mockImplementation(async (endpoint) => {
      if (endpoint === '/movie/337401') {
        return { ...tmdbMovie, imdb_id: null };
      }

      throw new Error(`Unexpected API request: ${endpoint}`);
    });

    const res = await request(app).get('/movie/337401/ratings/imdb');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.message, 'IMDb rating not found.');
    assert.strictEqual(externalGetMock.mock.callCount(), 1);
  });
});
