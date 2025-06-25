export const removeFromList = (list, value) => {
  const index = list.indexOf(value);

  if (index !== -1) {
    list.splice(index, 1);
  }

  return list;
};

export const emptyElement = (element) => {
  while (element.hasChildNodes()) {
    element.removeChild(element.firstChild);
  }
};

export const pickRandom = (array) =>
  array[Math.floor(Math.random() * array.length)];

export const getCumulativeOffsetTop = (element) => {
  let top = element.offsetTop;

  while ((element = element.offsetParent)) {
    top += element.offsetTop;
  }

  return top;
};

export const escapeProperty = (string) => string.replace(/"/g, "&quot;");
