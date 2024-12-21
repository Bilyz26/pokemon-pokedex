let pokemonData = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function getAttackClass(attackStat) {
    if (attackStat >= 100) return 'attack-high';
    if (attackStat >= 70) return 'attack-medium';
    return 'attack-low';
}

async function init() {
    showLoading(true);
    await fetchPokemonData();
    populateTypeFilter();
    setupEventListeners();
    showLoading(false);
}

async function fetchPokemonData() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await response.json();
        
        const promises = data.results.map(pokemon => 
            fetch(pokemon.url).then(res => res.json())
        );
        
        pokemonData = await Promise.all(promises);
        renderPokemon();
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        document.getElementById('pokemonGrid').innerHTML = 
            '<p>Error loading Pokémon. Please try again later.</p>';
    }
}

function renderPokemon() {
    const grid = document.getElementById('pokemonGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedType = document.getElementById('typeFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;

    let filtered = pokemonData
        .filter(pokemon => 
            pokemon.name.toLowerCase().includes(searchTerm) &&
            (!selectedType || pokemon.types.some(t => t.type.name === selectedType))
        )
        .sort((a, b) => {
            switch(sortOrder) {
                case 'name': return a.name.localeCompare(b.name);
                case 'height': return b.height - a.height;
                case 'weight': return b.weight - a.weight;
                default: return a.id - b.id;
            }
        });

    grid.innerHTML = filtered.map(pokemon => {
        const attackStat = pokemon.stats.find(stat => stat.stat.name === 'attack').base_stat;
        const attackClass = getAttackClass(attackStat);
        
        return `
            <div class="pokemon-card ${attackClass}">
                <button class="favorite-btn" onclick="toggleFavorite(${pokemon.id})">
                    ${favorites.includes(pokemon.id) ? '❤️' : '🤍'}
                </button>
                <img class="pokemon-image" 
                     src="${pokemon.sprites.front_default}" 
                     alt="${pokemon.name}">
                <h2 class="pokemon-name">${pokemon.name}</h2>
                <div class="pokemon-types">
                    ${pokemon.types.map(type => 
                        `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
                    ).join('')}
                </div>
                <button class="view-details-btn" onclick="showPokemonDetails(${pokemon.id})">
                    View Details
                </button>
            </div>
        `;
    }).join('');
}

function showPokemonDetails(id) {
    const pokemon = pokemonData.find(p => p.id === id);
    const attackStat = pokemon.stats.find(stat => stat.stat.name === 'attack').base_stat;
    const attackClass = getAttackClass(attackStat);
    const modal = document.getElementById('pokemonModal');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
        <div class="modal-content ${attackClass}">
            <button onclick="closeModal()" style="float: right;">×</button>
            <h2>${pokemon.name.toUpperCase()}</h2>
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <div class="pokemon-types">
                ${pokemon.types.map(type => 
                    `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
                ).join('')}
            </div>
            <div class="stats">
                <h3>Stats</h3>
                ${pokemon.stats.map(stat => `
                    <div>
                        <p>${stat.stat.name}: ${stat.base_stat}</p>
                        <div class="stats-bar">
                            <div class="stats-fill" style="width: ${(stat.base_stat / 255) * 100}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="abilities">
                <h3>Abilities</h3>
                ${pokemon.abilities.map(ability => 
                    `<p>${ability.ability.name}</p>`
                ).join('')}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderPokemon();
}

function populateTypeFilter() {
    const types = new Set();
    pokemonData.forEach(pokemon => {
        pokemon.types.forEach(type => types.add(type.type.name));
    });
    
    const typeFilter = document.getElementById('typeFilter');
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeFilter.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', renderPokemon);
    document.getElementById('typeFilter').addEventListener('change', renderPokemon);
    document.getElementById('sortOrder').addEventListener('change', renderPokemon);
}

function closeModal() {
    document.getElementById('pokemonModal').style.display = 'none';
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('pokemonModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Initialize the app
init(); 