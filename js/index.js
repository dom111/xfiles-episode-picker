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
  removeFromList,
} from "./utilities.js";

const filterEpisodes = (episodes) => {
  const options = getOptions();

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

  return episodes;
};

const episodeData = fetch("data/episode-list-data.json").then((response) =>
  response.json(),
);

const getEpisodeData = async () => episodeData;

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

const filtersElement = (options) => {
  const container = document.createElement("div");

  container.innerHTML = `
      <episode-filters options="${escapeProperty(JSON.stringify(options))}"></episode-filters>
    `;

  return container.firstElementChild;
};

// on ready
document.addEventListener("DOMContentLoaded", async () => {
  const episodeList = await getEpisodeData();

  // hide loading state
  document.querySelector("main").classList.remove("loading");

  // browse episodes actions
  document.querySelector(".browse").addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const browseElement = document.querySelector(".browse-episodes"),
      informationElement = document.querySelector(".episode-information");

    browseElement.removeAttribute("hidden");
    informationElement.setAttribute("hidden", "");

    window.scrollTo({
      top: getCumulativeOffsetTop(browseElement),
      behavior: "smooth",
    });
  });

  // season selector buttons
  document
    .querySelectorAll(".browse-episodes header button")
    .forEach((button) => {
      button.addEventListener("mousedown", async (event) => {
        if (event.button !== 0) {
          return;
        }

        event.preventDefault();

        const browseElement = document.querySelector(".browse-episodes"),
          episodeList = document.querySelector(".episode-list"),
          season = event.target.dataset.season;

        browseElement.setAttribute("hidden", "");
        episodeList.setAttribute("hidden", "");

        emptyElement(episodeList);

        (await episodeData)
          .filter((episode) => episode.season == season)
          .forEach((episode) => episodeList.append(episodeElement(episode)));

        browseElement.removeAttribute("hidden");
        episodeList.removeAttribute("hidden");
      });
    });

  // random episode action
  document
    .querySelector(".get-episode")
    .addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const filtered = filterEpisodes(episodeList),
        episode = pickRandom(filtered),
        informationElement = document.querySelector(".episode-information"),
        browseElement = document.querySelector(".browse-episodes"),
        episodeListElement = document.querySelector(".episode-list");

      emptyElement(informationElement);
      informationElement.append(episodeElement(episode));
      informationElement.removeAttribute("hidden");
      browseElement.setAttribute("hidden", "");
      episodeListElement.setAttribute("hidden", "");

      window.scrollTo({
        top: getCumulativeOffsetTop(informationElement),
        behavior: "smooth",
      });
    });

  // random episode filters
  const filtersContainer = document.querySelector(".filters-container"),
    [showFilters, hideFilters] = document.querySelectorAll(
      ".show-filters, .hide-filters",
    ),
    filters = filtersElement(getOptions());

  filtersContainer.appendChild(filters);

  filters.addEventListener("options-changed", (event) => {
    event.stopPropagation();

    setOptions(event.detail.options);
  });

  showFilters.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    filtersContainer.removeAttribute("hidden");
    showFilters.setAttribute("hidden", "");
    hideFilters.removeAttribute("hidden");
  });

  hideFilters.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    filtersContainer.setAttribute("hidden", "");
    showFilters.removeAttribute("hidden");
    hideFilters.setAttribute("hidden", "");
  });
});

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
