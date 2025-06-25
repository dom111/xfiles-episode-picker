import Base from "./base.js";
import { getCumulativeOffsetTop, removeFromList } from "../utilities.js";

export class EpisodeFilters extends Base {
  constructor() {
    super("template#filters");
  }

  initialise(clonedNode) {
    // Having to add this feels a bit rubbish...
    const style = document.createElement("link");

    style.setAttribute("rel", "stylesheet");
    style.setAttribute("href", "css/index.css");

    clonedNode.appendChild(style);

    const options = this.getOptions(),
      includeWatched = clonedNode.querySelector('input[data-filter="watched"]'),
      viewWatched = clonedNode.querySelector(".view-watched"),
      includeMotw = clonedNode.querySelector('input[data-filter="motw"]'),
      includeMythology = clonedNode.querySelector(
        'input[data-filter="mythology"]',
      ),
      includeSeasons = clonedNode.querySelectorAll(
        'input[data-filter="season"]',
      ),
      minRating = clonedNode.querySelector('input[data-filter="rating"]'),
      ratingValue = clonedNode.querySelector(".rating-value");

    if (options.excludeWatched) {
      includeWatched.removeAttribute("checked");
    } else {
      includeWatched.setAttribute("checked", "");
    }

    includeWatched.addEventListener("change", (event) => {
      const options = this.getOptions();

      options.excludeWatched = !event.target.checked;

      this.setOptions(options);
    });

    viewWatched.addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const watchedEpisodeIds = getWatched(),
        informationElement = document.querySelector(".episode-information"),
        browseElement = document.querySelector(".browse-episodes"),
        episodeListElement = document.querySelector(".episode-list");

      console.log(watchedEpisodeIds);

      emptyElement(episodeListElement);

      if (watchedEpisodeIds.length === 0) {
        episodeListElement.innerHTML = "<p>No episodes watched yet.</p>";
      } else {
        episodeList
          .filter((episode) => watchedEpisodeIds.includes(String(episode.id)))
          .forEach((episode) =>
            episodeListElement.append(episodeElement(episode)),
          );
      }

      informationElement.setAttribute("hidden", "");
      browseElement.setAttribute("hidden", "");
      episodeListElement.removeAttribute("hidden");

      window.scrollTo({
        top: getCumulativeOffsetTop(episodeListElement),
        behavior: "smooth",
      });
    });

    // handle episode types
    [
      ["motw", includeMotw],
      ["mythology", includeMythology],
    ].forEach(([type, element]) => {
      if (options.episodeTypes.includes(type)) {
        element.setAttribute("checked", "");
      } else {
        element.removeAttribute("checked");
      }

      element.addEventListener("change", (event) => {
        const options = this.getOptions();

        if (element.checked && !options.episodeTypes.includes(type)) {
          options.episodeTypes.push(type);
        } else if (!element.checked && options.episodeTypes.includes(type)) {
          removeFromList(options.episodeTypes, type);
        }

        this.setOptions(options);
      });
    });

    includeSeasons.forEach((seasonCheckbox) => {
      if (options.season.includes(seasonCheckbox.dataset.season)) {
        seasonCheckbox.setAttribute("checked", "");
      } else {
        seasonCheckbox.removeAttribute("checked");
      }

      seasonCheckbox.addEventListener("change", (event) => {
        const options = this.getOptions();

        if (
          event.target.checked &&
          !options.season.includes(event.target.dataset.season)
        ) {
          options.season.push(event.target.dataset.season);
        } else if (
          !event.target.checked &&
          options.season.includes(event.target.dataset.season)
        ) {
          removeFromList(options.season, event.target.dataset.season);
        }

        this.setOptions(options);
      });
    });

    minRating.value = options.minRating;

    minRating.addEventListener("input", (event) => {
      const options = this.getOptions();

      options.minRating = parseFloat(event.target.value);

      this.setOptions(options);

      ratingValue.innerText = options.minRating;
    });
  }

  getDefaultOptions() {
    const defaultOptionsProp = this.getAttribute("default-options");

    if (defaultOptionsProp) {
      return JSON.parse(defaultOptionsProp);
    }

    return {
      episodeTypes: ["motw"],
      excludeWatched: true,
      minRating: 7,
      season: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    };
  }

  getOptions() {
    const optionsProp = this.getAttribute("options");

    if (!optionsProp) {
      return this.getDefaultOptions();
    }

    return JSON.parse(optionsProp);
  }

  setOptions(options) {
    const optionsProp = JSON.stringify(options);

    this.setAttribute("options", optionsProp);

    this.dispatchEvent(
      new CustomEvent("options-changed", {
        detail: {
          options,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("episode-filters", EpisodeFilters);

export default EpisodeFilters;
