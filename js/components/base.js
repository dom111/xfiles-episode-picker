export class MissingTemplateSelector extends Error {
  constructor() {
    super("Missing template selector");
  }
}

export class Base extends HTMLElement {
  constructor(templateSelector = null) {
    super();

    if (!templateSelector) {
      throw new MissingTemplateSelector();
    }

    const template = document.querySelector(templateSelector),
      templateContent = template.content,
      shadowRoot = this.attachShadow({ mode: "open" }),
      clonedNode = templateContent.cloneNode(true),
      slots = clonedNode.querySelectorAll("slot");

    slots.forEach((slot) => {
      const name = slot.getAttribute("name");

      if (name) {
        const slotContent = this.querySelector(`[slot="${name}"]`);
        if (slotContent) {
          slot.replaceWith(slotContent);
        } else {
          console.warn(`Slot named "${name}" not found in the custom element.`);
        }
      } else {
        console.warn("Slot without a name attribute found.");
      }
    });

    this.initialise(clonedNode);

    shadowRoot.appendChild(clonedNode);
  }

  initialise(clonedNode) {
    return clonedNode;
  }
}

export default Base;
