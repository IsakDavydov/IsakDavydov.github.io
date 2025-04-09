// Global variables
let playerData = [];
let mockDraftData = {};
let teamPicksData = [];

// Load data based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        loadPlayerRankings();
    } else if (currentPage === 'mock-drafts.html') {
        loadMockDrafts();
    } else if (currentPage === 'team-picks.html') {
        loadTeamPicks();
    }
});

// Player Rankings Page
async function loadPlayerRankings() {
    try {
        const response = await fetch('data/player-rankings.json');
        const data = await response.json();
        playerData = data.players;
        renderPlayerTable();
        
        // Add event listener for position filter
        document.getElementById('position-filter').addEventListener('change', filterPlayersByPosition);
    } catch (error) {
        console.error('Error loading player rankings:', error);
    }
}

function renderPlayerTable() {
    const tableBody = document.getElementById('player-table-body');
    tableBody.innerHTML = '';
    
    playerData.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4">${player.rank}</td>
            <td class="px-6 py-4">${player.name}</td>
            <td class="px-6 py-4">${player.position}</td>
            <td class="px-6 py-4">${player.school}</td>
        `;
        tableBody.appendChild(row);
    });
}

function filterPlayersByPosition() {
    const selectedPosition = document.getElementById('position-filter').value;
    const filteredPlayers = selectedPosition === 'all' 
        ? playerData 
        : playerData.filter(player => player.position === selectedPosition);
    
    const tableBody = document.getElementById('player-table-body');
    tableBody.innerHTML = '';
    
    filteredPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4">${player.rank}</td>
            <td class="px-6 py-4">${player.name}</td>
            <td class="px-6 py-4">${player.position}</td>
            <td class="px-6 py-4">${player.school}</td>
        `;
        tableBody.appendChild(row);
    });
}

function sortTable(columnIndex) {
    const tableBody = document.getElementById('player-table-body');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent;
        const bValue = b.cells[columnIndex].textContent;
        
        if (columnIndex === 0) { // Rank column
            return parseInt(aValue) - parseInt(bValue);
        } else {
            return aValue.localeCompare(bValue);
        }
    });
    
    tableBody.innerHTML = '';
    rows.forEach(row => tableBody.appendChild(row));
}

// Mock Drafts Page
async function loadMockDrafts() {
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