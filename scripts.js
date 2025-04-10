// Global variables
let players = [];
let playerProfiles = [];
let currentSortColumn = 0;
let sortDirection = 1;
let mockDraftData = {};
let teamPicksData = [];

// Load data based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        loadPlayerData();
    } else if (currentPage === 'mock-draft.html') {
        loadMockDraft();
    } else if (currentPage === 'team-picks.html') {
        loadTeamPicks();
    }
});

// Load player data
async function loadPlayerData() {
    try {
        console.log('Loading player data...');
        const [rankingsResponse, profilesResponse] = await Promise.all([
            fetch('data/player-rankings.json'),
            fetch('data/player-profiles.json')
        ]);

        if (!rankingsResponse.ok || !profilesResponse.ok) {
            throw new Error('Failed to load player data');
        }

        const rankingsData = await rankingsResponse.json();
        const profilesData = await profilesResponse.json();

        console.log('Loaded rankings data:', rankingsData);
        console.log('Loaded profiles data:', profilesData);

        players = rankingsData.players;
        playerProfiles = profilesData.players;

        console.log('Players array:', players);
        console.log('Player profiles array:', playerProfiles);

        renderPlayers();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading player data:', error);
        document.getElementById('player-table-body').innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-red-500">
                    Error loading player data. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Render players in the table
function renderPlayers(filteredPlayers = players) {
    const tableBody = document.getElementById('player-table-body');
    tableBody.innerHTML = '';

    filteredPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 sm:px-6 py-4 whitespace-nowrap">${player.rank}</td>
            <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <button class="text-blue-600 hover:text-blue-800 font-medium player-name-btn" data-player-name="${player.name}">
                    ${player.name}
                </button>
            </td>
            <td class="px-4 sm:px-6 py-4 whitespace-nowrap">${player.position}</td>
            <td class="px-4 sm:px-6 py-4 whitespace-nowrap">${player.school}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Show player profile modal
function showPlayerProfile(playerName) {
    console.log('Attempting to show profile for:', playerName);
    console.log('Available profiles:', playerProfiles);

    const player = playerProfiles.find(p => p.name === playerName);
    if (!player) {
        console.error('Player profile not found:', playerName);
        return;
    }

    console.log('Found player profile:', player);

    // Update modal content
    document.getElementById('modal-player-name').textContent = player.name;
    document.getElementById('modal-height').textContent = player.height;
    document.getElementById('modal-weight').textContent = player.weight;
    document.getElementById('modal-age').textContent = player.age;

    // Update description
    const statsContainer = document.getElementById('modal-stats');
    statsContainer.innerHTML = `
        <p class="text-gray-700">${player.description}</p>
    `;

    // Show modal
    document.getElementById('player-modal').classList.remove('hidden');
    console.log('Modal should be visible now');
}

// Close modal
function closeModal() {
    document.getElementById('player-modal').classList.add('hidden');
}

// Format stat names for display
function formatStatName(stat) {
    return stat
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace('Yds', 'Yards')
        .replace('Tds', 'TDs');
}

// Setup event listeners
function setupEventListeners() {
    // Position filter
    document.getElementById('position-filter').addEventListener('change', (e) => {
        const position = e.target.value;
        const filteredPlayers = position === 'all' 
            ? players 
            : players.filter(player => player.position === position);
        renderPlayers(filteredPlayers);
    });

    // Player name click handler using event delegation
    document.getElementById('player-table-body').addEventListener('click', (e) => {
        if (e.target.classList.contains('player-name-btn')) {
            const playerName = e.target.getAttribute('data-player-name');
            showPlayerProfile(playerName);
        }
    });

    // Close modal when clicking outside
    document.getElementById('player-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('player-modal')) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Sort table
function sortTable(columnIndex) {
    if (currentSortColumn === columnIndex) {
        sortDirection *= -1;
    } else {
        currentSortColumn = columnIndex;
        sortDirection = 1;
    }

    players.sort((a, b) => {
        const aValue = Object.values(a)[columnIndex];
        const bValue = Object.values(b)[columnIndex];
        
        if (columnIndex === 0) { // Rank column
            return (aValue - bValue) * sortDirection;
        }
        
        return aValue.localeCompare(bValue) * sortDirection;
    });

    renderPlayers();
}

// Mock Drafts Page
async function loadMockDraft() {
    try {
        const response = await fetch('data/mock-drafts.json');
        const data = await response.json();
        mockDraftData = data.rounds;
        renderMockDraftTable();
        
        // Add event listener for round selection
        document.getElementById('round-select').addEventListener('change', renderMockDraftTable);
    } catch (error) {
        console.error('Error loading mock drafts:', error);
    }
}

function renderMockDraftTable() {
    const selectedRound = document.getElementById('round-select').value;
    const picks = mockDraftData[selectedRound] || [];
    const tableBody = document.getElementById('mock-draft-body');
    tableBody.innerHTML = '';
    
    picks.forEach(pick => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4">${pick.pick}</td>
            <td class="px-6 py-4">${pick.team}</td>
            <td class="px-6 py-4">${pick.player}</td>
            <td class="px-6 py-4">${pick.position}</td>
            <td class="px-6 py-4">${pick.school}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Team Picks Page
async function loadTeamPicks() {
    try {
        const response = await fetch('data/team-picks.json');
        const data = await response.json();
        teamPicksData = data.teams;
        renderTeamCards();
        
        // Add event listener for conference filter
        document.getElementById('conference-filter').addEventListener('change', renderTeamCards);
    } catch (error) {
        console.error('Error loading team picks:', error);
    }
}

function renderTeamCards() {
    const selectedConference = document.getElementById('conference-filter').value;
    const filteredTeams = selectedConference === 'all'
        ? teamPicksData
        : teamPicksData.filter(team => team.conference === selectedConference);
    
    const container = document.getElementById('teams-container');
    container.innerHTML = '';
    
    filteredTeams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-4';
        card.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${team.name}</h3>
            <p class="text-gray-600 mb-4">${team.conference}</p>
            <div class="space-y-2">
                ${team.picks.map(pick => `
                    <div class="flex justify-between">
                        <span>Round ${pick.round}</span>
                        <span>Pick ${pick.pick}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
} 