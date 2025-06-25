import Base from "./base.js";
import { removeFromList } from "../utilities.js";

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
      textInput = clonedNode.querySelector('input[data-filter="text"]'),
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
      ratingValue = clonedNode.querySelector(".rating-value"),
      hideText = this.dataset.hideText,
      hideWatched = this.dataset.hideWatched,
      hideEpisodeType = this.dataset.hideEpisodeType,
      hideSeason = this.dataset.hideSeason,
      hideRating = this.dataset.hideRating;

    if (!hideText) {
      clonedNode
        .querySelector('fieldset[data-group="text"]')
        .removeAttribute("hidden");
    }

    if (!hideWatched) {
      clonedNode
        .querySelector('fieldset[data-group="watched"]')
        .removeAttribute("hidden");
    }

    if (!hideEpisodeType) {
      clonedNode
        .querySelector('fieldset[data-group="episode-type"]')
        .removeAttribute("hidden");
    }

    if (!hideSeason) {
      clonedNode
        .querySelector('fieldset[data-group="season"]')
        .removeAttribute("hidden");
    }

    if (!hideRating) {
      clonedNode
        .querySelector('fieldset[data-group="rating"]')
        .removeAttribute("hidden");
    }

    if (options.text) {
      textInput.value = options.text;
    }

    textInput.addEventListener("input", () => {
      const options = this.getOptions(),
        targetValue = textInput.value;

      if (targetValue.length > 2) {
        options.text = targetValue;
      } else {
        options.text = null;
      }

      this.setOptions(options);
    });

    if (options.excludeWatched) {
      includeWatched.removeAttribute("checked");
    } else {
      includeWatched.setAttribute("checked", "");
    }

    includeWatched.addEventListener("change", () => {
      const options = this.getOptions();

      options.excludeWatched = !includeWatched.checked;

      this.setOptions(options);
    });

    // handle episode types
    [
      ["motw", includeMotw],
      ["mythology", includeMythology],
    ].forEach(([type, element]) => {
      if (options.episodeTypes && options.episodeTypes.includes(type)) {
        element.setAttribute("checked", "");
      } else {
        element.removeAttribute("checked");
      }

      element.addEventListener("change", () => {
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
      if (
        options.season &&
        options.season.includes(seasonCheckbox.dataset.season)
      ) {
        seasonCheckbox.setAttribute("checked", "");
      } else {
        seasonCheckbox.removeAttribute("checked");
      }

      seasonCheckbox.addEventListener("change", () => {
        const options = this.getOptions();

        if (
          seasonCheckbox.checked &&
          !options.season.includes(seasonCheckbox.dataset.season)
        ) {
          options.season.push(seasonCheckbox.dataset.season);
        } else if (
          !seasonCheckbox.checked &&
          options.season.includes(seasonCheckbox.dataset.season)
        ) {
          removeFromList(options.season, seasonCheckbox.dataset.season);
        }

        this.setOptions(options);
      });
    });

    minRating.value = options.minRating;

    minRating.addEventListener("input", () => {
      const options = this.getOptions();

      options.minRating = parseFloat(minRating.value);

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
      text: null,
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

    if (optionsProp === this.getAttribute("options")) {
      return;
    }

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
