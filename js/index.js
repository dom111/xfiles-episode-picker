import "./components/episode-details.js";
import "./components/episode-filters.js";

import {
  addWatched,
  getOptions,
  getWatched,
  isWatched,
  removeWatched,
  setOptions,
} from "./storage.js";
import {
  emptyElement,
  escapeProperty,
  getCumulativeOffsetTop,
  pickRandom,
} from "./utilities.js";

const filterEpisodes = (episodes, options) => {
  if (options.excludeWatched) {
    episodes = episodes.filter((episode) => !isWatched(episode.id));
  }

  if (options.season && options.season.length > 0) {
    episodes = episodes.filter((episode) =>
      options.season.includes(String(episode.season)),
    );
  }

  if (options.minRating > 0) {
    episodes = episodes.filter(
      (episode) =>
        episode.rating && episode.rating.average >= options.minRating,
    );
  }

  if (options.episodeTypes && options.episodeTypes.length > 0) {
    episodes = episodes.filter((episode) =>
      options.episodeTypes.includes(episode.episode_type),
    );
  }

  const textFields = options.textFields ?? ["name", "summary"];

  if (options.text && options.text.length > 2) {
    const words = options.text.trim().split(/\s+/);

    episodes = episodes.filter((episode) =>
      words.some((word) =>
        textFields.some((textField) =>
          episode[textField].match(new RegExp(word, "i")),
        ),
      ),
    );
  }

  return episodes;
};

const getEpisodeData = async () =>
  fetch("data/episode-list-data.json").then((response) => response.json());

const episodeElement = (episode) => {
  const container = document.createElement("div"),
    dateFormatter = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
    });

  container.innerHTML = `
      <episode-details data-id="${episode.id}" data-watched="${isWatched(episode.id) ? "1" : ""}">
        <span slot="title">${episode.name}</span>
        <span slot="season">${episode.season}</span>
        <span slot="episode">${episode.number}</span>
        <p slot="image"><img src="${episode.image.original}" alt="Still from the X-Files episode '${episode.name}'"></p>
        <span slot="airdate">${dateFormatter.format(Date.parse(episode.airdate))}</span>
        <span slot="type">${episode.episode_type === "motw" ? "Monster of the week" : "Mythology"}</span>
        <div slot="summary">${episode.summary}</div>
        <span slot="rating">${episode.rating.average}</span>
        <p class="actions">
            <button class="mark-as-watched">Mark as watched</button>
            <button class="remove-from-watched">Remove from watched</button>
        </p>
        </section>
      </episode-details>
    `;

  return container.firstElementChild;
};

const filtersElement = (
  options,
  {
    hideText = false,
    hideWatched = false,
    hideEpisodeType = false,
    hideSeason = false,
    hideRating = false,
  } = {},
) => {
  const container = document.createElement("div");

  container.innerHTML = `
      <episode-filters options="${escapeProperty(JSON.stringify(options))}"${hideText ? ' data-hide-text="1"' : ""}${hideWatched ? ' data-hide-watched="1"' : ""}${hideEpisodeType ? ' data-hide-episode-type="1"' : ""}${hideSeason ? ' data-hide-season="1"' : ""}${hideRating ? ' data-hide-rating="1"' : ""}></episode-filters>
    `;

  return container.firstElementChild;
};

// on ready
document.addEventListener("DOMContentLoaded", async () => {
  const episodeData = await getEpisodeData();

  const searchButton = document.querySelector(".search"),
    searchElement = document.querySelector(".search-episodes"),
    searchFiltersElement = document.querySelector(
      ".search-episodes .filters-container",
    ),
    mainElement = document.querySelector("main"),
    getRandomEpisodeButton = document.querySelector(".get-episode"),
    browseButton = document.querySelector(".browse"),
    browseSeasonButtons = document.querySelectorAll(
      ".browse-episodes header button",
    ),
    browseElement = document.querySelector(".browse-episodes"),
    episodeListElement = document.querySelector(".episode-list"),
    randomEpisodeFiltersElement = document.querySelector(".filters-container");

  // hide loading state
  mainElement.classList.remove("loading");

  // random episode action
  getRandomEpisodeButton.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const episodes = filterEpisodes(episodeData, getOptions()),
      episode = pickRandom(episodes);

    renderResults([episode], episodeListElement);

    browseElement.setAttribute("hidden", "");
    episodeListElement.removeAttribute("hidden");
    searchElement.setAttribute("hidden", "");

    window.scrollTo({
      top: getCumulativeOffsetTop(episodeListElement),
      behavior: "smooth",
    });
  });

  // browse episodes actions
  browseButton.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    emptyElement(episodeListElement);
    browseElement.removeAttribute("hidden");
    episodeListElement.setAttribute("hidden", "");
    searchElement.setAttribute("hidden", "");

    window.scrollTo({
      top: getCumulativeOffsetTop(browseElement),
      behavior: "smooth",
    });
  });

  // season selector buttons
  browseSeasonButtons.forEach((button) => {
    button.addEventListener("mousedown", async (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const season = event.target.dataset.season;

      browseElement.setAttribute("hidden", "");
      episodeListElement.setAttribute("hidden", "");

      emptyElement(episodeListElement);

      const episodes = filterEpisodes(episodeData, {
        season: [season],
      });

      episodes.forEach((episode) =>
        episodeListElement.append(episodeElement(episode)),
      );

      browseElement.removeAttribute("hidden");
      episodeListElement.removeAttribute("hidden");
    });
  });

  // random episode filters
  const [showFilters, hideFilters] = document.querySelectorAll(
      ".show-filters, .hide-filters",
    ),
    filters = filtersElement(getOptions(), { hideText: true });

  randomEpisodeFiltersElement.appendChild(filters);

  filters.addEventListener("options-changed", (event) => {
    event.stopPropagation();

    setOptions(event.detail.options);
  });

  showFilters.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    randomEpisodeFiltersElement.removeAttribute("hidden");
    showFilters.setAttribute("hidden", "");
    hideFilters.removeAttribute("hidden");
  });

  hideFilters.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    randomEpisodeFiltersElement.setAttribute("hidden", "");
    showFilters.removeAttribute("hidden");
    hideFilters.setAttribute("hidden", "");
  });

  const searchFilters = filtersElement(
    {
      episodeTypes: ["motw", "mythology"],
      excludeWatched: false,
      minRating: 7,
      season: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
      text: null,
    },
    {
      hideWatched: true,
    },
  );

  searchFiltersElement.appendChild(searchFilters);

  searchFiltersElement.addEventListener("options-changed", (event) => {
    episodeListElement.setAttribute("hidden", "");

    emptyElement(episodeListElement);

    const episodes = filterEpisodes(episodeData, searchFilters.getOptions());

    renderResults(episodes, episodeListElement);

    episodeListElement.removeAttribute("hidden");
  });

  searchButton.addEventListener("mousedown", async (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    emptyElement(episodeListElement);

    const episodes = filterEpisodes(episodeData, searchFilters.getOptions());

    renderResults(episodes, episodeListElement);

    episodeListElement.removeAttribute("hidden");
    browseElement.setAttribute("hidden", "");
    searchElement.setAttribute("hidden", "");
    searchElement.removeAttribute("hidden");
  });

  document.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.matches(".view-watched")) {
      event.preventDefault();

      const watchedEpisodeIds = getWatched();

      emptyElement(episodeListElement);

      if (watchedEpisodeIds.length === 0) {
        episodeListElement.innerHTML = "<p>No episodes watched yet.</p>";
      } else {
        const episodes = episodeData.filter((episode) =>
          watchedEpisodeIds.includes(String(episode.id)),
        );

        renderResults(episodes, episodeListElement);
      }

      episodeListElement.removeAttribute("hidden");

      window.scrollTo({
        top: getCumulativeOffsetTop(episodeListElement),
        behavior: "smooth",
      });
    }
  });
}); // DOMContentLoaded

const renderResults = (episodes, container) => {
  emptyElement(container);

  if (episodes.length > 0) {
    episodes.forEach((episode) => container.append(episodeElement(episode)));

    return;
  }

  container.innerHTML = `
    <p>Sorry, no episodes matched your criteria.</p>
  `;
};

// page-level events
document.addEventListener("watched-status-change", (event) => {
  const { id, watched } = event.detail;

  if (watched) {
    addWatched(id);
  } else {
    removeWatched(id);
  }

  document.querySelectorAll("episode-details").forEach((element) =>
    element.dispatchEvent(
      new CustomEvent("watched-status-changed", {
        detail: {
          id,
          watched,
        },
        bubbles: true,
        composed: true,
      }),
    ),
  );
});
