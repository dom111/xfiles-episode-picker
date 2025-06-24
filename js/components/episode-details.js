customElements.define('episode-details', class extends HTMLElement {
  constructor() {
    super();

    const episodeId = this.dataset.id,
      isWatched = this.dataset.watched,
      template = document.querySelector("template#episode-details"),
      templateContent = template.content,
      shadowRoot = this.attachShadow({ mode: "open" }),
      clonedNode = templateContent.cloneNode(true),
      slots = clonedNode.querySelectorAll('slot'),
      style = document.createElement('link');

    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', 'css/index.css');

    clonedNode.appendChild(style);

    slots.forEach((slot) => {
      const name = slot.getAttribute('name');

      if (name) {
        const slotContent = this.querySelector(`[slot="${name}"]`);
        if (slotContent) {
          slot.replaceWith(slotContent);
        } else {
          console.warn(`Slot named "${name}" not found in the custom element.`);
        }
      } else {
        console.warn('Slot without a name attribute found.');
      }
    });

    const buttons = clonedNode.querySelectorAll('button');

    buttons.forEach((button) => {
      button.addEventListener('mousedown', (event) => {
        if (event.button !== 0) {
          return;
        }

        event.preventDefault();

        button.dispatchEvent(new CustomEvent('watched-status-change', {
          detail: {
            id: episodeId,
            watched: button.dataset.action === 'mark-as-watched',
          },
          bubbles: true,
          composed: true
        }));
      });

      if (isWatched && button.dataset.action === 'mark-as-watched') {
        button.setAttribute('hidden', '');
      }

      if (isWatched && button.dataset.action === 'remove-from-watched') {
        button.removeAttribute('hidden');
      }

      if (!isWatched && button.dataset.action === 'mark-as-watched') {
        button.removeAttribute('hidden');
      }

      if (!isWatched && button.dataset.action === 'remove-from-watched') {
        button.setAttribute('hidden', '');
      }
    });

    this.addEventListener('watched-status-changed', (event) => {
      const {
        id,
        watched
      } = event.detail;

      if (episodeId != id) {
        return;
      }

      const [watchedButton, removeButton] = buttons;

      if (watched) {
        watchedButton.setAttribute('hidden', '');
        removeButton.removeAttribute('hidden');
      }
      else {
        watchedButton.removeAttribute('hidden');
        removeButton.setAttribute('hidden', '');
      }
    });

    shadowRoot.appendChild(clonedNode);
  }
});