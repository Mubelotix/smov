import { Dropdown } from "components/Dropdown";
import { Episode } from "components/media/EpisodeButton";
import { useLoading } from "hooks/useLoading";
import { serializePortableMedia } from "hooks/usePortableMedia";
import {
  convertMediaToPortable,
  MWMedia,
  MWMediaSeasons,
  MWPortableMedia,
} from "providers";
import { getSeasonDataFromMedia } from "providers/methods/seasons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

export interface SeasonsProps {
  media: MWMedia;
}

export function Seasons(props: SeasonsProps) {
  const [searchSeasons, loading, error, success] = useLoading(
    (portableMedia: MWPortableMedia) => getSeasonDataFromMedia(portableMedia)
  );
  const history = useHistory();
  const [seasons, setSeasons] = useState<MWMediaSeasons>({ seasons: [] });
  const seasonSelected = props.media.season as number;
  const episodeSelected = props.media.episode as number;

  useEffect(() => {
    (async () => {
      const seasonData = await searchSeasons(props.media);
      setSeasons(seasonData);
    })();
  }, [searchSeasons, props.media]);

  function navigateToSeasonAndEpisode(season: number, episode: number) {
    const newMedia: MWMedia = { ...props.media };
    newMedia.episode = episode;
    newMedia.season = season;
    history.replace(
      `/media/${newMedia.mediaType}/${serializePortableMedia(
        convertMediaToPortable(newMedia)
      )}`
    );
  }

  const options = seasons.seasons.map((season) => ({
    id: season.seasonNumber,
    name: `Season ${season.seasonNumber}`,
  }));

  const selectedItem = {
    id: seasonSelected,
    name: `Season ${seasonSelected}`,
  };

  return (
    <>
      {loading ? <p>Loading...</p> : null}
      {error ? <p>error!</p> : null}
      {success && seasons.seasons.length ? (
        <>
          <Dropdown
            selectedItem={selectedItem}
            options={options}
            setSelectedItem={(seasonItem) =>
              navigateToSeasonAndEpisode(
                seasonItem.id,
                seasons.seasons[seasonItem.id]?.episodes[0].episodeNumber
              )
            }
          />
          {seasons.seasons[seasonSelected]?.episodes.map((v) => (
            <Episode
              key={v.episodeNumber}
              episodeNumber={v.episodeNumber}
              active={v.episodeNumber === episodeSelected}
              onClick={() =>
                navigateToSeasonAndEpisode(seasonSelected, v.episodeNumber)
              }
            />
          ))}
        </>
      ) : null}
    </>
  );
}
