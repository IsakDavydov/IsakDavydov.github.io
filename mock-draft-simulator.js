// Mock Draft Simulator
console.log('Mock Draft Simulator script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Initialize state
    let currentTeam = null;
    let draftPicks = [];
    let availablePlayers = [];
    let teams = [];
    let currentPick = 1;
    let isUserTurn = false;
    
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
    const draftStatus = document.getElementById('draft-status');
    
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
        teamNeeds,
        draftStatus
    });

    // Load teams data
    fetch('data/teams.json')
        .then(response => {
            console.log('Teams data response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Teams data loaded:', data);
            teams = data.teams;
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
                school: player.college,
                rank: player.pos_rank,
                height: player.height,
                weight: player.weight
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
        currentPick = 1;
        isUserTurn = false;
        draftPicks = [];
        updateDraftBoard();
        
        // Find the team's pick
        const currentTeamData = teams.find(t => t.name === currentTeam);
        if (!currentTeamData) return;
        
        const teamPick = currentTeamData.pick;
        
        // Simulate AI picks until team's pick
        while (currentPick < teamPick) {
            const team = teams.find(t => t.pick === currentPick);
            if (team) {
                makeAIPick(team);
            }
            currentPick++;
        }
        
        // It's user's turn
        isUserTurn = true;
        updateDraftStatus();
    }

    function makeAIPick(team) {
        const teamNeeds = team.needs;
        const availablePlayersForTeam = availablePlayers.filter(player => 
            teamNeeds.includes(player.position)
        );
        
        if (availablePlayersForTeam.length > 0) {
            // Sort by position rank and pick the best available
            availablePlayersForTeam.sort((a, b) => a.rank - b.rank);
            const selectedPlayer = availablePlayersForTeam[0];
            
            // Add pick to draft board
            draftPicks.push({
                team: team.name,
                name: selectedPlayer.name,
                position: selectedPlayer.position,
                school: selectedPlayer.school
            });
            
            // Remove player from available players
            availablePlayers = availablePlayers.filter(p => 
                p.name !== selectedPlayer.name
            );
            
            // Update UI
            updateDraftBoard();
            updateAvailablePlayersTable();
            updateDraftStatus();
        }
    }

    function simulateAIPicks() {
        // Find the current team's next pick
        const currentTeamData = teams.find(t => t.name === currentTeam);
        if (!currentTeamData) return;
        
        // Calculate next user pick (32 picks later)
        const nextUserPick = currentTeamData.pick + 32;
        if (nextUserPick > 32) return; // End of first round
        
        // Simulate AI picks until next user pick
        while (currentPick < nextUserPick) {
            const team = teams.find(t => t.pick === currentPick);
            if (team) {
                makeAIPick(team);
            }
            currentPick++;
        }
        
        // It's user's turn
        isUserTurn = true;
        updateDraftStatus();
    }

    function makeUserPick(playerId) {
        if (!isUserTurn) {
            alert("It's not your turn to pick!");
            return;
        }

        const player = availablePlayers.find(p => p.id === playerId);
        if (!player) {
            alert("Player not found!");
            return;
        }

        // Add pick to draft board
        draftPicks.push({
            team: currentTeam,
            name: player.name,
            position: player.position,
            school: player.school
        });
        
        // Remove player from available players
        availablePlayers = availablePlayers.filter(p => p.id !== playerId);
        
        // Update UI
        updateDraftBoard();
        updateAvailablePlayersTable();
        updateDraftStatus();
        
        // Move to next pick and continue simulation
        currentPick++;
        isUserTurn = false;
        simulateAIPicks();
    }

    function updateDraftStatus() {
        if (isUserTurn) {
            draftStatus.textContent = `It's your turn to pick! (Pick #${currentPick})`;
            draftStatus.className = 'text-green-600 font-semibold';
        } else {
            draftStatus.textContent = `Waiting for AI picks... (Pick #${currentPick})`;
            draftStatus.className = 'text-gray-600';
        }
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
        currentPick = 1;
        isUserTurn = false;
        teamInfo.classList.add('hidden');
        updateDraftBoard();
        updateAvailablePlayersTable();
        draftStatus.textContent = '';
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
            const isUserPick = pick.team === currentTeam;
            pickElement.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${index + 1}.</span>
                    <span class="${isUserPick ? 'text-blue-600 font-semibold' : ''}">${pick.team}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span>${pick.name}</span>
                    <span class="text-gray-600">${pick.position}</span>
                    <span class="text-gray-600">${pick.school}</span>
                </div>
                ${isUserPick ? `
                    <button onclick="removePick(${index})" class="text-red-600 hover:text-red-800">
                        Remove
                    </button>
                ` : ''}
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
                            <p class="font-medium">Physical:</p>
                            <p class="text-xs">${player.height}, ${player.weight}</p>
                        </div>
                    </div>
                </td>
            `;
            availablePlayersTable.appendChild(row);
        });
    }

    function updateTeamInfo() {
        console.log('Updating team info for:', currentTeam);
        const team = teams.find(t => t.name === currentTeam);
        if (team) {
            teamName.textContent = team.name;
            teamPick.textContent = `Pick #${team.pick}`;
            teamNeeds.innerHTML = team.needs.map(need => 
                `<span class="bg-gray-200 px-2 py-1 rounded text-sm">${need}</span>`
            ).join('');
        }
    }

    // Global functions for draft actions
    window.draftPlayer = function(name, position, school) {
        console.log('Drafting player:', { name, position, school });
        if (!currentTeam) {
            alert('Please select a team first');
            return;
        }
        if (!isUserTurn) {
            alert('It\'s not your turn to pick yet!');
            return;
        }
        
        // Add pick to draft board
        draftPicks.push({
            team: currentTeam,
            name,
            position,
            school
        });
        
        // Remove the selected player from available players
        availablePlayers = availablePlayers.filter(player => 
            player.name !== name
        );
        
        // Update UI
        updateDraftBoard();
        updateAvailablePlayersTable();
        
        // Move to next pick and continue simulation
        currentPick++;
        isUserTurn = false;
        updateDraftStatus();
        
        // Simulate next AI picks
        simulateAIPicks();
    };

    window.removePick = function(index) {
        console.log('Removing pick at index:', index);
        const pick = draftPicks[index];
        if (pick.team === currentTeam) {
            // Add the player back to available players
            availablePlayers.push({
                name: pick.name,
                position: pick.position,
                school: pick.school,
                rank: pick.rank,
                height: pick.height,
                weight: pick.weight
            });
            draftPicks.splice(index, 1);
            updateDraftBoard();
            updateAvailablePlayersTable();
        }
    };

    window.closeAnalysisModal = function() {
        console.log('Closing analysis modal');
        document.getElementById('analysis-modal').classList.add('hidden');
    };
}); 