import Base from "./base.js";

export class EpisodeDetails extends Base {
  constructor() {
    super("template#episode-details");
  }

  initialise(clonedNode) {
    const episodeId = this.dataset.id,
      isWatched = this.dataset.watched,
      // Having to add this feels a bit rubbish...
      style = document.createElement("link");

    style.setAttribute("rel", "stylesheet");
    style.setAttribute("href", "css/index.css");

    clonedNode.appendChild(style);

    const buttons = clonedNode.querySelectorAll("button");

    buttons.forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        if (event.button !== 0) {
          return;
        }

        event.preventDefault();

        button.dispatchEvent(
          new CustomEvent("watched-status-change", {
            detail: {
              id: episodeId,
              watched: button.dataset.action === "mark-as-watched",
            },
            bubbles: true,
            composed: true,
          }),
        );
      });

      if (isWatched && button.dataset.action === "mark-as-watched") {
        button.setAttribute("hidden", "");
      }

      if (isWatched && button.dataset.action === "remove-from-watched") {
        button.removeAttribute("hidden");
      }

      if (!isWatched && button.dataset.action === "mark-as-watched") {
        button.removeAttribute("hidden");
      }

      if (!isWatched && button.dataset.action === "remove-from-watched") {
        button.setAttribute("hidden", "");
      }
    });

    this.addEventListener("watched-status-changed", (event) => {
      const { id, watched } = event.detail;

      if (episodeId != id) {
        return;
      }

      const [watchedButton, removeButton] = buttons;

      if (watched) {
        watchedButton.setAttribute("hidden", "");
        removeButton.removeAttribute("hidden");
      } else {
        watchedButton.removeAttribute("hidden");
        removeButton.setAttribute("hidden", "");
      }
    });
  }
}

customElements.define("episode-details", EpisodeDetails);

export default EpisodeDetails;
