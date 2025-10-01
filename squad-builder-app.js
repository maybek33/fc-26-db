let allPlayers = [];
let currentSquad = [];
let currentFormation = '4-3-3';
let selectedSlotIndex = -1;
let sortByChemistry = false;

const formations = {
    '4-3-3': ['GK','LB','CB','CB','RB','CM','CM','CM','LW','ST','RW'],
    '4-4-2': ['GK','LB','CB','CB','RB','LM','CM','CM','RM','ST','ST'],
    '4-2-3-1': ['GK','LB','CB','CB','RB','CDM','CDM','LM','CAM','RM','ST'],
    '3-4-3': ['GK','CB','CB','CB','LM','CM','CM','RM','LW','ST','RW']
};

// Load data from GitHub
fetch('https://cdn.jsdelivr.net/gh/maybek33/fc-26-db@main/squad_players%20(1).json')
    .then(r => r.json())
    .then(data => {
        allPlayers = data;
        currentSquad = formations[currentFormation].map(() => ({position: 'EMPTY'}));
        populateFilters();
        renderFormation();
    });

function populateFilters() {
    const nations = [...new Set(allPlayers.map(p => p.nationality))].sort();
    const leagues = [...new Set(allPlayers.map(p => p.league))].sort();
    
    const nationFilter = document.getElementById('nationFilter');
    nations.forEach(nation => {
        const opt = document.createElement('option');
        opt.value = nation;
        opt.textContent = nation;
        nationFilter.appendChild(opt);
    });
    
    const leagueFilter = document.getElementById('leagueFilter');
    leagues.forEach(league => {
        const opt = document.createElement('option');
        opt.value = league;
        opt.textContent = league;
        leagueFilter.appendChild(opt);
    });
}

// Copy ALL the functions from your HTML here (renderFormation, organizeIntoRows, etc.)
