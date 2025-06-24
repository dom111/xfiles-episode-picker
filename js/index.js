const getWatched = () => {
  const watched = localStorage.getItem('watched');

  return watched ? JSON.parse(watched) : [];
};

const setWatched = (watched) =>
  localStorage.setItem('watched', JSON.stringify(watched));

const addWatched = (id) => {
  const watched = getWatched();

  if (!isWatched(id)) {
    watched.push(String(id));

    setWatched(watched);
  }
};

const removeFromList = (list, value) => {
  const index = list.indexOf(value);

  if (index !== -1) {
    list.splice(index, 1);
  }

  return list;
};

const removeWatched = (id) => {
  if (!isWatched(id)) {
    return;
  }

  const watched = getWatched();

  removeFromList(watched, String(id));
  setWatched(watched);
};

const isWatched = (id) => {
    const watched = getWatched();

    return watched.includes(String(id));
};

const filterEpisodes = (episodes) => {
  const options = getOptions();

  if (options.excludeWatched) {
    episodes = episodes.filter((episode) => !isWatched(episode.id));
  }

  if (options.season && options.season.length > 0) {
    episodes = episodes.filter((episode) => options.season.includes(String(episode.season)));
  }

  if (options.minRating > 0) {
    episodes = episodes.filter((episode) => episode.rating && episode.rating.average >= options.minRating);
  }

  if (options.episodeTypes && options.episodeTypes.length > 0) {
    episodes = episodes.filter((episode) => options.episodeTypes.includes(episode.episode_type));
  }

  return episodes;
};

const emptyElement = (element) => {
    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }
};

const getOptions = () => {
  const options = localStorage.getItem('options');

  if (options) {
    return JSON.parse(options);
  }

  return {
    'episodeTypes': ['motw'],
    'excludeWatched': true,
    'minRating': 7,
    'season': ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  };
};

const setOptions = (options) =>
  localStorage.setItem('options', JSON.stringify(options));

const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

const episodeData = fetch('/data/episode-list-data.json')
    .then((response) => response.json());

const getEpisodeData = async () => episodeData;

const episodeElement = (episode) => {
  const container = document.createElement('div'),
    dateFormatter = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'long',
    });

  container.innerHTML = `
      <episode-details data-id="${episode.id}" data-watched="${isWatched(episode.id) ? '1' : ''}">
        <span slot="title">${episode.name}</span>
        <span slot="season">${episode.season}</span>
        <span slot="episode">${episode.number}</span>
        <p slot="image"><img src="${episode.image.original}" alt="Still from the X-Files episode '${episode.name}'"></p>
        <span slot="airdate">${dateFormatter.format(Date.parse(episode.airdate))}</span>
        <span slot="type">${episode.episode_type === 'motw' ? 'Monster of the week' : 'Mythology'}</span>
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

const getCumulativeOffsetTop = (element) => {
  let top = element.offsetTop;

  while (element = element.offsetParent) {
    top += element.offsetTop;
  }

  return top;
}

// on ready
document.addEventListener('DOMContentLoaded', async () => {
  const episodeList = await getEpisodeData();

  // hide loading state
  document.querySelector('main').classList.remove('loading');

  // browse episodes actions
  document.querySelector('.browse').addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const browseElement = document.querySelector('.browse-episodes'),
      informationElement = document.querySelector('.episode-information');

    browseElement.removeAttribute('hidden');
    informationElement.setAttribute('hidden', '');

    window.scrollTo({
      top: getCumulativeOffsetTop(browseElement),
      behavior: 'smooth'
    });
  });

  // season selector buttons
  document.querySelectorAll('.browse-episodes header button').forEach((button) => {
    button.addEventListener('mousedown', async (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const browseElement = document.querySelector('.browse-episodes'),
        episodeList = document.querySelector('.episode-list'),
        season = event.target.dataset.season;

      browseElement.setAttribute('hidden', '');
      episodeList.setAttribute('hidden', '');

      emptyElement(episodeList);

      (await episodeData)
          .filter((episode) => episode.season == season)
          .forEach((episode) => episodeList.append(episodeElement(episode)));

      browseElement.removeAttribute('hidden');
      episodeList.removeAttribute('hidden');
    });

    // random episode filters
    const [showFilters, hideFilters] = document.querySelectorAll('.show-filters, .hide-filters');

    showFilters.addEventListener('mousedown', (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const filtersElement = document.querySelector('.filters');

      filtersElement.removeAttribute('hidden');
      showFilters.setAttribute('hidden', '');
      hideFilters.removeAttribute('hidden');
    });

    hideFilters.addEventListener('mousedown', (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const filtersElement = document.querySelector('.filters');

      filtersElement.setAttribute('hidden', '');
      showFilters.removeAttribute('hidden');
      hideFilters.setAttribute('hidden', '');
    });

    const options = getOptions(),
      includeWatched = document.querySelector('input[data-filter="watched"]'),
      viewWatched = document.querySelector('.view-watched'),
      includeMotw = document.querySelector('input[data-filter="motw"]'),
      includeMythology = document.querySelector('input[data-filter="mythology"]'),
      includeSeasons = document.querySelectorAll('input[data-filter="season"]'),
      minRating = document.querySelector('input[data-filter="rating"]'),
      ratingValue = document.querySelector('.rating-value');

    if (options.excludeWatched) {
      includeWatched.removeAttribute('checked');
    }
    else {
      includeWatched.setAttribute('checked', '');
    }

    includeWatched.addEventListener('change', (event) => {
      const options = getOptions();

      options.excludeWatched = !event.target.checked;

      setOptions(options);
    });

    viewWatched.addEventListener('mousedown', (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();

      const watchedEpisodeIds = getWatched(),
        informationElement = document.querySelector('.episode-information'),
        browseElement = document.querySelector('.browse-episodes'),
        episodeListElement = document.querySelector('.episode-list');

      console.log(watchedEpisodeIds);

      emptyElement(episodeListElement);

      if (watchedEpisodeIds.length === 0) {
        episodeListElement.innerHTML = '<p>No episodes watched yet.</p>';
      }
      else {
        episodeList
          .filter((episode) => watchedEpisodeIds.includes(String(episode.id)))
          .forEach((episode) => episodeListElement.append(episodeElement(episode)));
      }

      informationElement.setAttribute('hidden', '');
      browseElement.setAttribute('hidden', '');
      episodeListElement.removeAttribute('hidden');

      window.scrollTo({
        top: getCumulativeOffsetTop(episodeListElement),
        behavior: 'smooth'
      });
    });

    // handle episode types
    [['motw', includeMotw], ['mythology', includeMythology]].forEach(([type, element]) => {
      if (options.episodeTypes.includes(type)) {
        element.setAttribute('checked', '');
      }
      else {
        element.removeAttribute('checked');
      }

      element.addEventListener('change', (event) => {
        const options = getOptions();

        if (element.checked && !options.episodeTypes.includes(type)) {
          options.episodeTypes.push(type);
        }
        else if (!element.checked && options.episodeTypes.includes(type)) {
          removeFromList(options.episodeTypes, type);
        }

        setOptions(options);
      });
    });

    includeSeasons.forEach((seasonCheckbox) => {
      if (options.season.includes(seasonCheckbox.dataset.season)) {
        seasonCheckbox.setAttribute('checked', '');
      }
      else {
        seasonCheckbox.removeAttribute('checked');
      }

      seasonCheckbox.addEventListener('change', (event) => {
        const options = getOptions();

        if (event.target.checked && !options.season.includes(event.target.dataset.season)) {
          options.season.push(event.target.dataset.season);
        }
        else if (!event.target.checked && options.season.includes(event.target.dataset.season)) {
          removeFromList(options.season, event.target.dataset.season);
        }

        setOptions(options);
      });
    });

    minRating.value = options.minRating;

    minRating.addEventListener('input', (event) => {
      const options = getOptions();

      options.minRating = parseFloat(event.target.value);

      setOptions(options);

      ratingValue.innerText = options.minRating;
    });
  });

  // random episode action
  document.querySelector('.get-episode').addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();


    const filtered = filterEpisodes(episodeList),
      episode = pickRandom(filtered),
      informationElement = document.querySelector('.episode-information'),
      browseElement = document.querySelector('.browse-episodes'),
      episodeListElement = document.querySelector('.episode-list');

    emptyElement(informationElement);
    informationElement.append(episodeElement(episode));
    informationElement.removeAttribute('hidden')
    browseElement.setAttribute('hidden', '');
    episodeListElement.setAttribute('hidden', '');

    window.scrollTo({
      top: getCumulativeOffsetTop(informationElement),
      behavior: 'smooth'
    });
  });
});

// page-level events
document.addEventListener('watched-status-change', (event) => {
  const {
    id,
    watched
  } = event.detail;

  if (watched) {
    addWatched(id);
  }
  else {
    removeWatched(id);
  }

  document.querySelectorAll('episode-details').forEach((element) =>
    element.dispatchEvent(new CustomEvent('watched-status-changed', {
      detail: {
        id,
        watched
      },
      bubbles: true,
      composed: true
    })
  ));
});
