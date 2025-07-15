const API_URL = "https://rickandmortyapi.com/api/character";

const elements = {
  getAllBtn: document.getElementById("getAllBtn"),
  filterForm: document.getElementById("filterForm"),
  resetFiltersBtn: document.getElementById("resetFilters"),
  resultsDiv: document.getElementById("results"),
  errorMsg: document.getElementById("error"),
  loadingMsg: document.getElementById("loading"),
  prevPageBtn: document.getElementById("prevPage"),
  nextPageBtn: document.getElementById("nextPage"),
  currentPageSpan: document.getElementById("currentPage"),
  totalPagesText: document.getElementById("totalPages"),
  toggleDarkModeBtn: document.getElementById("toggleDarkMode"),
  goToForm: document.getElementById("goToForm"),
  goToInput: document.getElementById("goToInput")
};

let state = {
  currentPage: 1,
  totalPages: 1,
  currentFilters: null,
  isLoading: false
};

const VALID_STATUS = ["alive", "dead", "unknown", ""];
const VALID_GENDER = ["female", "male", "genderless", "unknown", ""];

const MESSAGES = {
  LOADING: "Cargando personajes...",
  NO_CHARACTERS: "No se encontraron personajes en esta página.",
  INVALID_STATUS: "Estado inválido. Valores permitidos: alive, dead, unknown",
  INVALID_GENDER: "Género inválido. Valores permitidos: female, male, genderless, unknown",
  EPISODE_UNKNOWN: "Episodio desconocido",
  EPISODE_ERROR: "Error al cargar episodio",
  PAGE_OUT_OF_RANGE: "Página fuera de rango. Ingrese un número entre 1 y",
  NETWORK_ERROR: "Error de conexión. Verifique su conexión a internet."
};

async function fetchEpisodesData(characters) {
  const episodePromises = characters.map(async (char) => {
    if (!char.episode || char.episode.length === 0) {
      return { characterId: char.id, episodeName: MESSAGES.EPISODE_UNKNOWN };
    }
    
    try {
      const response = await fetch(char.episode[0]);
      if (response.ok) {
        const episodeData = await response.json();
        return { characterId: char.id, episodeName: episodeData.name };
      }
      return { characterId: char.id, episodeName: MESSAGES.EPISODE_ERROR };
    } catch (error) {
      console.warn(`Error fetching episode for character ${char.id}:`, error);
      return { characterId: char.id, episodeName: MESSAGES.EPISODE_ERROR };
    }
  });

  const episodesData = await Promise.all(episodePromises);
  return episodesData.reduce((acc, episode) => {
    acc[episode.characterId] = episode.episodeName;
    return acc;
  }, {});
}

function createCharacterCard(character, firstEpisodeName) {
  const card = document.createElement("div");
  card.className = `card ${character.status.toLowerCase()}`;
  card.setAttribute("role", "article");
  card.setAttribute("aria-label", `Información de ${character.name}`);

  card.innerHTML = `
    <img src="${character.image}" 
         alt="Imagen de ${character.name}" 
         loading="lazy"
         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='" />
    <div class="card-content">
      <h3>${character.name}</h3>
      <p><strong>Estado:</strong> <span class="status ${character.status.toLowerCase()}">${character.status}</span></p>
      <p><strong>Especie:</strong> ${character.species}</p>
      <p><strong>Género:</strong> ${character.gender}</p>
      <p><strong>Ubicación:</strong> ${character.location.name}</p>
      <p><strong>Primer episodio:</strong> ${firstEpisodeName}</p>
    </div>
  `;

  return card;
}

async function renderCharacters(characters) {
  if (!characters || characters.length === 0) {
    elements.resultsDiv.innerHTML = '<p class="no-results">No se encontraron personajes.</p>';
    return;
  }

  elements.resultsDiv.innerHTML = "";
  
  try {
    const episodesData = await fetchEpisodesData(characters);
    
    const fragment = document.createDocumentFragment();
    characters.forEach(character => {
      const firstEpisodeName = episodesData[character.id] || MESSAGES.EPISODE_UNKNOWN;
      const card = createCharacterCard(character, firstEpisodeName);
      fragment.appendChild(card);
    });
    
    elements.resultsDiv.appendChild(fragment);
    
    announceToScreenReader(`Se cargaron ${characters.length} personajes`);
    
  } catch (error) {
    console.error("Error renderizando personajes:", error);
    elements.resultsDiv.innerHTML = '<p class="error">Error al mostrar los personajes.</p>';
  }
}

function announceToScreenReader(message) {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

function updatePaginationUI() {
  elements.currentPageSpan.textContent = `Página: ${state.currentPage}`;
  elements.prevPageBtn.disabled = state.currentPage === 1;
  elements.nextPageBtn.disabled = state.currentPage === state.totalPages;
  elements.totalPagesText.textContent = `Total de páginas: ${state.totalPages}`;
  
  elements.prevPageBtn.setAttribute("aria-label", 
    state.currentPage === 1 ? "Página anterior (no disponible)" : "Ir a página anterior");
  elements.nextPageBtn.setAttribute("aria-label", 
    state.currentPage === state.totalPages ? "Página siguiente (no disponible)" : "Ir a página siguiente");
}

function showLoading(show) {
  state.isLoading = show;
  elements.loadingMsg.style.display = show ? "block" : "none";
  elements.loadingMsg.textContent = show ? MESSAGES.LOADING : "";
  
  elements.getAllBtn.disabled = show;
  elements.resetFiltersBtn.disabled = show;
  elements.prevPageBtn.disabled = show || state.currentPage === 1;
  elements.nextPageBtn.disabled = show || state.currentPage === state.totalPages;
}

function showError(message) {
  elements.errorMsg.textContent = message;
  elements.errorMsg.setAttribute("role", "alert");
  announceToScreenReader(`Error: ${message}`);
}
function clearError() {
  elements.errorMsg.textContent = "";
  elements.errorMsg.removeAttribute("role");
}

function validateFilters(filters) {
  const errors = [];
  
  if (filters.status && !VALID_STATUS.includes(filters.status)) {
    errors.push(MESSAGES.INVALID_STATUS);
  }
  
  if (filters.gender && !VALID_GENDER.includes(filters.gender)) {
    errors.push(MESSAGES.INVALID_GENDER);
  }
  
  return errors;
}

async function fetchCharacters(page = 1, filters = null) {
  if (state.isLoading) return;
  
  clearError();
  elements.resultsDiv.innerHTML = "";
  showLoading(true);
  
  state.currentPage = page;
  state.currentFilters = filters;

  const params = new URLSearchParams(filters || {});
  params.append("page", page);

  try {
    const response = await fetch(`${API_URL}/?${params.toString()}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(MESSAGES.NO_CHARACTERS);
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error(MESSAGES.NO_CHARACTERS);
    }
    
    await renderCharacters(data.results);
    state.totalPages = data.info.pages;
    updatePaginationUI();
    
  } catch (error) {
    console.error("Error fetching characters:", error);
    
    if (error.name === "TypeError") {
      showError(MESSAGES.NETWORK_ERROR);
    } else {
      showError(error.message);
    }
    
    elements.totalPagesText.textContent = "";
  } finally {
    showLoading(false);
  }
}

function loadFirstPage(filters = null) {
  fetchCharacters(1, filters);
}

elements.getAllBtn.addEventListener("click", () => {
  elements.filterForm.reset();
  loadFirstPage();
});

elements.filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError();

  const name = document.getElementById("name")?.value?.trim() || "";
  const status = document.getElementById("status")?.value?.trim().toLowerCase() || "";
  const species = document.getElementById("species")?.value?.trim() || "";
  const type = document.getElementById("type")?.value?.trim() || "";
  const gender = document.getElementById("gender")?.value?.trim().toLowerCase() || "";

  const validationErrors = validateFilters({ status, gender });
  if (validationErrors.length > 0) {
    showError(validationErrors.join(". "));
    return;
  }

  const filters = {};
  if (name) filters.name = name;
  if (status) filters.status = status;
  if (species) filters.species = species;
  if (type) filters.type = type;
  if (gender) filters.gender = gender;

  loadFirstPage(filters);
});

elements.resetFiltersBtn.addEventListener("click", () => {
  elements.filterForm.reset();
  clearError();
  loadFirstPage();
});

elements.prevPageBtn.addEventListener("click", () => {
  if (state.currentPage > 1 && !state.isLoading) {
    fetchCharacters(state.currentPage - 1, state.currentFilters);
  }
});

elements.nextPageBtn.addEventListener("click", () => {
  if (state.currentPage < state.totalPages && !state.isLoading) {
    fetchCharacters(state.currentPage + 1, state.currentFilters);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  
  if (e.key === "ArrowLeft" && !elements.prevPageBtn.disabled) {
    elements.prevPageBtn.click();
  } else if (e.key === "ArrowRight" && !elements.nextPageBtn.disabled) {
    elements.nextPageBtn.click();
  }
});

elements.toggleDarkModeBtn.addEventListener("click", () => {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  elements.toggleDarkModeBtn.textContent = isDarkMode ? "☀️ Modo claro" : "🌙 Modo oscuro";
  
  try {
    localStorage.setItem("darkMode", isDarkMode);
  } catch (e) {
    console.warn("No se pudo guardar la preferencia de modo oscuro");
  }
});

try {
  const savedDarkMode = localStorage.getItem("darkMode") === "true";
  if (savedDarkMode) {
    document.body.classList.add("dark-mode");
    elements.toggleDarkModeBtn.textContent = "☀️ Modo claro";
  }
} catch (e) {
  console.warn("No se pudo cargar la preferencia de modo oscuro");
}

elements.goToForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const pageInput = elements.goToInput.value.trim();
  
  if (!pageInput) {
    showError("Por favor ingrese un número de página");
    return;
  }
  
  const page = parseInt(pageInput, 10);
  
  if (isNaN(page) || page < 1) {
    showError("Por favor ingrese un número válido mayor a 0");
    return;
  }
  
  if (page > state.totalPages) {
    showError(`${MESSAGES.PAGE_OUT_OF_RANGE} ${state.totalPages}`);
    return;
  }
  
  clearError();
  fetchCharacters(page, state.currentFilters);
  elements.goToInput.value = "";
});

document.addEventListener("DOMContentLoaded", () => {
  const missingElements = Object.entries(elements).filter(([key, element]) => !element);
  if (missingElements.length > 0) {
    console.error("Elementos faltantes en el DOM:", missingElements.map(([key]) => key));
    return;
  }
  
  loadFirstPage();
});