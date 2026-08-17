import RTFresh from '@app/assets/rt_fresh.svg';
import RTRotten from '@app/assets/rt_rotten.svg';
import ImdbLogo from '@app/assets/services/imdb.svg';
import TmdbLogo from '@app/assets/services/tmdb.svg';
import defineMessages from '@app/utils/defineMessages';
import type { IMDBRating } from '@server/api/rating/imdbRadarrProxy';
import type { RTRating } from '@server/api/rating/rottentomatoes';
import { CardRatingProvider } from '@server/constants/rating';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

interface TitleCardRatingProps {
  id: number;
  provider: CardRatingProvider;
  shouldFetch: boolean;
  tmdbScore?: number;
}

interface RatingBadgeProps {
  icon: ReactNode;
  label: string;
  provider: CardRatingProvider;
  score: string;
}

const messages = defineMessages('components.TitleCard.TitleCardRating', {
  imdbRating: 'IMDb user score: {score} out of 10',
  rottenTomatoesRating: 'Rotten Tomatoes Tomatometer: {score}%',
  tmdbRating: 'TMDB user score: {score}%',
});

const RatingBadge = ({ icon, label, provider, score }: RatingBadgeProps) => (
  <div
    className="pointer-events-none flex h-7 shrink-0 items-center gap-1 rounded-md bg-black/80 px-1.5 text-xs font-semibold text-white shadow-md"
    role="img"
    aria-label={label}
    data-testid="title-card-rating"
    data-rating-provider={provider}
  >
    <span aria-hidden="true">{icon}</span>
    <span aria-hidden="true">{score}</span>
  </div>
);

const TitleCardRating = ({
  id,
  provider,
  shouldFetch,
  tmdbScore,
}: TitleCardRatingProps) => {
  const intl = useIntl();
  const { data: imdbRating } = useSWR<IMDBRating>(
    shouldFetch && provider === CardRatingProvider.IMDB
      ? `/api/v1/movie/${id}/ratings/imdb`
      : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const { data: rottenTomatoesRating } = useSWR<RTRating>(
    shouldFetch && provider === CardRatingProvider.ROTTEN_TOMATOES
      ? `/api/v1/movie/${id}/ratings`
      : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (
    provider === CardRatingProvider.IMDB &&
    typeof imdbRating?.criticsScore === 'number' &&
    imdbRating.criticsScore > 0
  ) {
    const score = intl.formatNumber(imdbRating.criticsScore, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return (
      <RatingBadge
        icon={<ImdbLogo className="h-3 w-6" />}
        label={intl.formatMessage(messages.imdbRating, { score })}
        provider={provider}
        score={score}
      />
    );
  }

  if (
    provider === CardRatingProvider.ROTTEN_TOMATOES &&
    rottenTomatoesRating?.criticsRating &&
    typeof rottenTomatoesRating.criticsScore === 'number'
  ) {
    const score = intl.formatNumber(rottenTomatoesRating.criticsScore);

    return (
      <RatingBadge
        icon={
          rottenTomatoesRating.criticsRating === 'Rotten' ? (
            <RTRotten className="h-4 w-4" />
          ) : (
            <RTFresh className="h-4 w-4" />
          )
        }
        label={intl.formatMessage(messages.rottenTomatoesRating, { score })}
        provider={provider}
        score={`${score}%`}
      />
    );
  }

  if (
    provider === CardRatingProvider.TMDB &&
    typeof tmdbScore === 'number' &&
    tmdbScore > 0
  ) {
    const score = intl.formatNumber(Math.round(tmdbScore * 10));

    return (
      <RatingBadge
        icon={<TmdbLogo className="h-4 w-6" />}
        label={intl.formatMessage(messages.tmdbRating, { score })}
        provider={provider}
        score={`${score}%`}
      />
    );
  }

  return null;
};

export default TitleCardRating;
