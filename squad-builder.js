// EA FC 26 Squad Builder
let allPlayers = [];
let currentSquad = [];
let currentFormation = '4-3-3';
let selectedSlotIndex = null;
let sortByChemistry = false;

// Formation configurations
const formations = {
    '4-3-3': [
        ['ST'], ['LW', 'ST', 'RW'], ['CM', 'CM', 'CM'], ['LB', 'CB', 'CB', 'RB'], ['GK']
    ],
    '4-4-2': [
        ['ST', 'ST'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'CB', 'CB', 'RB'], ['GK']
    ],
    '4-2-3-1': [
        ['ST'], ['LM', 'CAM', 'RM'], ['CDM', 'CDM'], ['LB', 'CB', 'CB', 'RB'], ['GK']
    ],
    '3-4-3': [
        ['ST'], ['LW', 'ST', 'RW'], ['LM', 'CM', 'CM', 'RM'], ['CB', 'CB', 'CB'], ['GK']
    ],
    '3-5-2': [
        ['ST', 'ST'], ['LM', 'CM', 'CM', 'CM', 'RM'], ['CB', 'CB', 'CB'], ['GK']
    ],
    '5-3-2': [
        ['ST', 'ST'], ['CM', 'CM', 'CM'], ['LWB', 'CB', 'CB', 'CB', 'RWB'], ['GK']
    ]
};

// Position compatibility mapping
const positionCompatibility = {
    'ST': ['ST', 'CF', 'LW', 'RW'],
    'CF': ['CF', 'ST', 'CAM'],
    'LW': ['LW', 'LM', 'ST'],
    'RW': ['RW', 'RM', 'ST'],
    'CAM': ['CAM', 'CM', 'CF'],
    'CM': ['CM', 'CAM', 'CDM'],
    'CDM': ['CDM', 'CM', 'CB'],
    'LM': ['LM', 'LW', 'LWB'],
    'RM': ['RM', 'RW', 'RWB'],
    'LWB': ['LWB', 'LB', 'LM'],
    'RWB': ['RWB', 'RB', 'RM'],
    'LB': ['LB', 'LWB', 'CB'],
    'RB': ['RB', 'RWB', 'CB'],
    'CB': ['CB', 'CDM'],
    'GK': ['GK']
};

// Load players from GitHub
async function loadPlayers() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/gh/maybek33/fc-26-db@6325a33c44395bc639a9c03fee5c80e8f95c25fa/squad_players%20(1).json');
        allPlayers = await response.json();
        
        // Clean up the data
        allPlayers = allPlayers.map(player => ({
            ...player,
            club: player.club || 'Free Agent',
            is_hero: player.is_hero || false,
            is_icon: player.is_icon || false
        }));
        
        initializeApp();
    } catch (error) {
        console.error('Error loading players:', error);
        document.querySelector('.container').innerHTML = '<div class="loading">Error loading player data. Please refresh the page.</div>';
    }
}

// Initialize the app
function initializeApp() {
    populateFilters();
    renderFormation();
    updateStats();
}

// Populate filter dropdowns
function populateFilters() {
    const nationalities = [...new Set(allPlayers.map(p => p.nationality))].sort();
    const leagues = [...new Set(allPlayers.map(p => p.league))].sort();
    
    const nationFilter = document.getElementById('nationFilter');
    const leagueFilter = document.getElementById('leagueFilter');
    
    nationalities.forEach(nat => {
        const option = document.createElement('option');
        option.value = nat;
        option.textContent = nat;
        nationFilter.appendChild(option);
    });
    
    leagues.forEach(league => {
        const option = document.createElement('option');
        option.value = league;
        option.textContent = league;
        leagueFilter.appendChild(option);
    });
}

// Render the formation
function renderFormation() {
    const grid = document.getElementById('formationGrid');
    grid.innerHTML = '';
    
    const formationRows = formations[currentFormation];
    currentSquad = [];
    
    formationRows.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'formation-row';
        
        row.forEach((position, posIndex) => {
            const slot = createPlayerSlot(position, currentSquad.length);
            rowDiv.appendChild(slot);
            currentSquad.push(null);
        });
        
        grid.appendChild(rowDiv);
    });
}

// Create a player slot
function createPlayerSlot(position, slotIndex) {
    const slot = document.createElement('div');
    slot.className = 'player-slot empty';
    slot.onclick = () => openPlayerModal(slotIndex, position);
    
    slot.innerHTML = `
        <div class="position-badge">${position}</div>
        <div class="empty-text">Click to add</div>
    `;
    
    return slot;
}

// Update a slot with player data
function updateSlot(slotIndex, player) {
    const slots = document.querySelectorAll('.player-slot');
    const slot = slots[slotIndex];
    
    if (!player) {
        const position = getSlotPosition(slotIndex);
        slot.className = 'player-slot empty';
        slot.innerHTML = `
            <div class="position-badge">${position}</div>
            <div class="empty-text">Click to add</div>
        `;
        return;
    }
    
    const chemistry = calculatePlayerChemistry(slotIndex, player);
    slot.className = 'player-slot';
    
    const specialBadge = player.is_hero ? '<span class="special-badge badge-hero">HERO</span>' : 
                        player.is_icon ? '<span class="special-badge badge-icon">ICON</span>' : '';
    
    slot.innerHTML = `
        <div class="position-badge">${player.position}</div>
        <div class="chemistry-indicator chem-${chemistry}">${chemistry}</div>
        <div class="player-rating">${player.rating}</div>
        <div class="player-name">${player.name}${specialBadge}</div>
        <div class="player-details">${player.club}</div>
    `;
}

// Get position for a slot index
function getSlotPosition(slotIndex) {
    const formationRows = formations[currentFormation];
    let count = 0;
    for (let row of formationRows) {
        for (let pos of row) {
            if (count === slotIndex) return pos;
            count++;
        }
    }
    return 'ST';
}

// Calculate chemistry for a player in a slot
function calculatePlayerChemistry(slotIndex, player) {
    let chemistry = 0;
    const requiredPosition = getSlotPosition(slotIndex);
    
    // Position match
    if (player.position === requiredPosition) {
        chemistry = 3;
    } else if (positionCompatibility[requiredPosition]?.includes(player.position)) {
        chemistry = 2;
    } else {
        chemistry = 0;
    }
    
    // Check adjacent players for links
    const adjacentPlayers = getAdjacentPlayers(slotIndex);
    let links = 0;
    
    adjacentPlayers.forEach(adjPlayer => {
        if (adjPlayer) {
            if (adjPlayer.club === player.club) links += 2;
            else if (adjPlayer.nationality === player.nationality) links += 1;
            else if (adjPlayer.league === player.league) links += 1;
        }
    });
    
    // Adjust chemistry based on links
    if (links >= 4) chemistry = Math.min(3, chemistry + 1);
    else if (links >= 2) chemistry = Math.max(1, chemistry);
    else chemistry = Math.max(0, chemistry - 1);
    
    return Math.max(0, Math.min(3, chemistry));
}

// Get adjacent players for chemistry calculation
function getAdjacentPlayers(slotIndex) {
    const adjacent = [];
    const formationRows = formations[currentFormation];
    let currentRow = 0;
    let currentPos = 0;
    let count = 0;
    
    // Find current position in grid
    for (let r = 0; r < formationRows.length; r++) {
        for (let p = 0; p < formationRows[r].length; p++) {
            if (count === slotIndex) {
                currentRow = r;
                currentPos = p;
            }
            count++;
        }
    }
    
    // Get adjacent positions
    count = 0;
    for (let r = 0; r < formationRows.length; r++) {
        for (let p = 0; p < formationRows[r].length; p++) {
            if (Math.abs(r - currentRow) <= 1 && Math.abs(p - currentPos) <= 1 && count !== slotIndex) {
                adjacent.push(currentSquad[count]);
            }
            count++;
        }
    }
    
    return adjacent;
}

// Open player selection modal
function openPlayerModal(slotIndex, position) {
    selectedSlotIndex = slotIndex;
    document.getElementById('modalPosition').textContent = position;
    document.getElementById('playerModal').classList.add('active');
    document.getElementById('playerSearch').value = '';
    document.getElementById('nationFilter').value = '';
    document.getElementById('leagueFilter').value = '';
    sortByChemistry = false;
    document.getElementById('chemToggle').classList.remove('active');
    filterPlayers();
}

// Close modal
function closeModal() {
    document.getElementById('playerModal').classList.remove('active');
}

// Filter and display players
function filterPlayers() {
    const searchTerm = document.getElementById('playerSearch').value.toLowerCase();
    const nationFilter = document.getElementById('nationFilter').value;
    const leagueFilter = document.getElementById('leagueFilter').value;
    const position = getSlotPosition(selectedSlotIndex);
    
    let filtered = allPlayers.filter(player => {
        const compatiblePositions = positionCompatibility[position] || [position];
        const positionMatch = compatiblePositions.includes(player.position);
        const searchMatch = !searchTerm || 
            player.name.toLowerCase().includes(searchTerm) ||
            player.club.toLowerCase().includes(searchTerm) ||
            player.league.toLowerCase().includes(searchTerm) ||
            player.nationality.toLowerCase().includes(searchTerm);
        const nationMatch = !nationFilter || player.nationality === nationFilter;
        const leagueMatch = !leagueFilter || player.league === leagueFilter;
        
        return positionMatch && searchMatch && nationMatch && leagueMatch;
    });
    
    // Sort players
    if (sortByChemistry) {
        filtered.sort((a, b) => {
            const chemA = calculatePlayerChemistry(selectedSlotIndex, a);
            const chemB = calculatePlayerChemistry(selectedSlotIndex, b);
            if (chemB !== chemA) return chemB - chemA;
            return b.rating - a.rating;
        });
    } else {
        filtered.sort((a, b) => b.rating - a.rating);
    }
    
    displayPlayerList(filtered);
}

// Display player list in modal
function displayPlayerList(players) {
    const listDiv = document.getElementById('playerList');
    listDiv.innerHTML = '';
    
    players.slice(0, 100).forEach(player => {
        const chemistry = calculatePlayerChemistry(selectedSlotIndex, player);
        const card = document.createElement('div');
        card.className = 'player-card';
        card.onclick = () => selectPlayer(player);
        
        const chemClass = chemistry >= 2 ? 'chem-positive' : chemistry === 1 ? 'chem-neutral' : 'chem-negative';
        const specialBadge = player.is_hero ? '<span class="special-badge badge-hero">HERO</span>' : 
                            player.is_icon ? '<span class="special-badge badge-icon">ICON</span>' : '';
        
        card.innerHTML = `
            <div class="player-card-rating">${player.rating}</div>
            <div class="player-card-info">
                <div class="player-card-name">${player.name}${specialBadge}</div>
                <div class="player-card-meta">${player.position} • ${player.club} • ${player.nationality}</div>
            </div>
            <div class="player-card-chem ${chemClass}">Chem: ${chemistry}</div>
            <div class="player-card-price">$${player.price.toLocaleString()}</div>
        `;
        
        listDiv.appendChild(card);
    });
}

// Select a player
function selectPlayer(player) {
    currentSquad[selectedSlotIndex] = player;
    updateSlot(selectedSlotIndex, player);
    updateStats();
    closeModal();
    
    // Update chemistry for all players
    currentSquad.forEach((p, index) => {
        if (p) updateSlot(index, p);
    });
}

// Update squad statistics
function updateStats() {
    const playerCount = currentSquad.filter(p => p !== null).length;
    let totalChemistry = 0;
    let totalPrice = 0;
    
    currentSquad.forEach((player, index) => {
        if (player) {
            totalChemistry += calculatePlayerChemistry(index, player);
            totalPrice += player.price;
        }
    });
    
    document.getElementById('teamChemistry').textContent = `${totalChemistry}/33`;
    document.getElementById('playerCount').textContent = `${playerCount}/11`;
    document.getElementById('squadPrice').textContent = `$${totalPrice.toLocaleString()}`;
}

// Change formation
function changeFormation(formation) {
    currentFormation = formation;
    renderFormation();
    updateStats();
}

// Toggle chemistry sort
function toggleChemSort() {
    sortByChemistry = !sortByChemistry;
    const toggle = document.getElementById('chemToggle');
    if (sortByChemistry) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    filterPlayers();
}

// Show chemistry suggestions
function showChemistrySuggestions() {
    alert('This feature will suggest the best players to maximize your squad chemistry based on your current selections!');
}

// Clear squad
function clearSquad() {
    if (confirm('Are you sure you want to clear your squad?')) {
        currentSquad.forEach((player, index) => {
            currentSquad[index] = null;
            updateSlot(index, null);
        });
        updateStats();
    }
}

// Initialize on page load
function initSquadBuilder() {
    // Check if required elements exist
    const formationGrid = document.getElementById('formationGrid');
    if (!formationGrid) {
        console.error('Squad Builder: formationGrid element not found. Make sure the HTML is properly embedded.');
        return;
    }
    
    loadPlayers();
}

// Try multiple initialization methods for WordPress compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSquadBuilder);
} else {
    // DOM already loaded
    initSquadBuilder();
}

// Also try after a short delay for WordPress preview mode
setTimeout(initSquadBuilder, 500);

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('playerModal');
    if (modal && e.target.id === 'playerModal') {
        closeModal();
    }
});
