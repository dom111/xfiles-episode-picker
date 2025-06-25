import { removeFromList } from "./utilities.js";

export const getWatched = () => {
  const watched = localStorage.getItem("watched");

  return watched ? JSON.parse(watched) : [];
};

export const setWatched = (watched) =>
  localStorage.setItem("watched", JSON.stringify(watched));

export const addWatched = (id) => {
  const watched = getWatched();

  if (!isWatched(id)) {
    watched.push(String(id));

    setWatched(watched);
  }
};

export const getOptions = () => {
  const options = localStorage.getItem("options");

  if (options) {
    return JSON.parse(options);
  }

  return {
    episodeTypes: ["motw"],
    excludeWatched: true,
    minRating: 7,
    season: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  };
};

export const setOptions = (options) =>
  localStorage.setItem("options", JSON.stringify(options));

export const removeWatched = (id) => {
  if (!isWatched(id)) {
    return;
  }

  const watched = getWatched();

  removeFromList(watched, String(id));
  setWatched(watched);
};

export const isWatched = (id) => {
  const watched = getWatched();

  return watched.includes(String(id));
};
