// Mock Draft Simulator
console.log('Mock Draft Simulator script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Initialize state
    let currentTeam = null;
    let draftPicks = [];
    let availablePlayers = [];
    
    // DOM Elements
    const teamSelect = document.getElementById('team-select');
    const startDraftBtn = document.getElementById('start-draft');
    const saveDraftBtn = document.getElementById('save-draft');
    const resetDraftBtn = document.getElementById('reset-draft');
    const playerSearch = document.getElementById('player-search');
    const draftBoard = document.getElementById('draft-board');
    const availablePlayersTable = document.getElementById('available-players');
    const teamInfo = document.getElementById('team-info');
    const teamName = document.getElementById('team-name');
    const teamPick = document.getElementById('team-pick');
    const teamNeeds = document.getElementById('team-needs');
    
    console.log('DOM elements loaded:', {
        teamSelect,
        startDraftBtn,
        saveDraftBtn,
        resetDraftBtn,
        playerSearch,
        draftBoard,
        availablePlayersTable,
        teamInfo,
        teamName,
        teamPick,
        teamNeeds
    });

    // Load teams data
    fetch('data/teams.json')
        .then(response => {
            console.log('Teams data response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Teams data loaded:', data);
            // Populate team select
            data.teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.name;
                option.textContent = team.name;
                teamSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading teams data:', error);
        });

    // Load players data
    fetch('data/player-profiles-v2.json')
        .then(response => {
            console.log('Players data response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Players data loaded:', data);
            availablePlayers = data.players.map(player => ({
                name: player.name,
                position: player.position,
                school: player.school,
                rank: player.rank,
                description: player.description
            }));
            updateAvailablePlayersTable();
        })
        .catch(error => {
            console.error('Error loading players data:', error);
        });

    // Event Listeners
    startDraftBtn.addEventListener('click', () => {
        console.log('Start draft button clicked');
        startDraft();
    });

    saveDraftBtn.addEventListener('click', () => {
        console.log('Save draft button clicked');
        saveDraft();
    });

    resetDraftBtn.addEventListener('click', () => {
        console.log('Reset draft button clicked');
        resetDraft();
    });

    playerSearch.addEventListener('input', () => {
        console.log('Player search input changed');
        filterPlayers();
    });

    // Functions
    function startDraft() {
        console.log('Starting draft for team:', teamSelect.value);
        currentTeam = teamSelect.value;
        if (!currentTeam) {
            alert('Please select a team first');
            return;
        }
        teamInfo.classList.remove('hidden');
        updateTeamInfo();
    }

    function saveDraft() {
        console.log('Saving draft:', draftPicks);
        if (draftPicks.length === 0) {
            alert('No picks to save');
            return;
        }
        // Save to local storage
        localStorage.setItem('savedDraft', JSON.stringify({
            team: currentTeam,
            picks: draftPicks
        }));
        alert('Draft saved successfully');
    }

    function resetDraft() {
        console.log('Resetting draft');
        draftPicks = [];
        currentTeam = null;
        teamInfo.classList.add('hidden');
        updateDraftBoard();
        updateAvailablePlayersTable();
    }

    function filterPlayers() {
        console.log('Filtering players with search term:', playerSearch.value);
        const searchTerm = playerSearch.value.toLowerCase();
        const filteredPlayers = availablePlayers.filter(player => 
            player.name.toLowerCase().includes(searchTerm) ||
            player.position.toLowerCase().includes(searchTerm) ||
            player.school.toLowerCase().includes(searchTerm)
        );
        updateAvailablePlayersTable(filteredPlayers);
    }

    function updateDraftBoard() {
        console.log('Updating draft board with picks:', draftPicks);
        draftBoard.innerHTML = '';
        if (draftPicks.length === 0) {
            draftBoard.innerHTML = '<div class="text-center text-gray-500 py-8">Select a team to start your mock draft</div>';
            return;
        }
        draftPicks.forEach((pick, index) => {
            const pickElement = document.createElement('div');
            pickElement.className = 'flex items-center justify-between p-4 border-b';
            pickElement.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${index + 1}.</span>
                    <span>${pick.team}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span>${pick.name}</span>
                    <span class="text-gray-600">${pick.position}</span>
                    <span class="text-gray-600">${pick.school}</span>
                </div>
                <button onclick="removePick(${index})" class="text-red-600 hover:text-red-800">
                    Remove
                </button>
            `;
            draftBoard.appendChild(pickElement);
        });
    }

    function updateAvailablePlayersTable(players = availablePlayers) {
        console.log('Updating available players table with:', players);
        availablePlayersTable.innerHTML = '';
        players.forEach(player => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3">${player.rank}</td>
                <td class="px-4 py-3">${player.name}</td>
                <td class="px-4 py-3">${player.position}</td>
                <td class="px-4 py-3">${player.school}</td>
                <td class="px-4 py-3">
                    <div class="space-y-2">
                        <button onclick="draftPlayer('${player.name}', '${player.position}', '${player.school}')" 
                                class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                            Draft
                        </button>
                        <div class="text-sm text-gray-600">
                            <p class="font-medium">Best Fits:</p>
                            <p class="text-xs">${player.teamFits.join(', ')}</p>
                        </div>
                    </div>
                </td>
            `;
            availablePlayersTable.appendChild(row);
        });
    }

    function updateTeamInfo() {
        console.log('Updating team info for:', currentTeam);
        // Fetch team data
        fetch('data/teams.json')
            .then(response => response.json())
            .then(data => {
                const team = data.teams.find(t => t.name === currentTeam);
                if (team) {
                    teamName.textContent = team.name;
                    teamPick.textContent = `Pick #${team.draftPick}`;
                    teamNeeds.innerHTML = team.needs.map(need => 
                        `<span class="bg-gray-200 px-2 py-1 rounded text-sm">${need}</span>`
                    ).join('');
                }
            });
    }

    // Global functions for draft actions
    window.draftPlayer = function(name, position, school) {
        console.log('Drafting player:', { name, position, school });
        if (!currentTeam) {
            alert('Please select a team first');
            return;
        }
        draftPicks.push({
            team: currentTeam,
            name,
            position,
            school
        });
        updateDraftBoard();
        updateAvailablePlayersTable();
    };

    window.removePick = function(index) {
        console.log('Removing pick at index:', index);
        draftPicks.splice(index, 1);
        updateDraftBoard();
        updateAvailablePlayersTable();
    };

    window.closeAnalysisModal = function() {
        console.log('Closing analysis modal');
        document.getElementById('analysis-modal').classList.add('hidden');
    };
}); 