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
                weight: player.weight,
                // Add overall rank for top prospects
                overallRank: player.name === 'Cam Ward' ? 1 : 
                           player.name === 'Travis Hunter' ? 2 :
                           player.name === 'Abdul Carter' ? 3 :
                           player.name === 'Will Campbell' ? 4 :
                           player.name === 'Mason Graham' ? 5 :
                           player.pos_rank + 100 // Default to position rank + 100 for other players
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
        
        // Reset state
        teamInfo.classList.remove('hidden');
        currentPick = 1;
        isUserTurn = false;
        draftPicks = [];
        
        // Update UI
        updateTeamInfo();
        updateDraftBoard();
        updateDraftStatus();
        
        // Find the team's pick
        const currentTeamData = teams.find(t => t.name === currentTeam);
        if (!currentTeamData) {
            console.error('Team data not found for:', currentTeam);
            return;
        }
        
        const teamPick = currentTeamData.pick;
        console.log('Team pick number:', teamPick);
        
        // Simulate AI picks until team's pick
        simulateInitialAIPicks(teamPick);
    }

    function simulateInitialAIPicks(teamPick) {
        if (currentPick >= teamPick) {
            // It's user's turn
            isUserTurn = true;
            updateDraftStatus();
            return;
        }

        const team = teams.find(t => t.pick === currentPick);
        if (team) {
            console.log('Making initial AI pick for team:', team.name);
            makeAIPick(team);
        } else {
            console.log('No team found for pick:', currentPick);
            currentPick++;
        }
        
        // Use setTimeout to prevent UI freezing
        setTimeout(() => {
            simulateInitialAIPicks(teamPick);
        }, 100);
    }

    function makeAIPick(team) {
        console.log('Making AI pick for team:', team.name);
        const teamNeeds = team.needs;
        
        // First, check if any top prospects are available
        const topProspects = availablePlayers.filter(player => player.overallRank <= 5);
        if (topProspects.length > 0) {
            // Sort by overall rank and pick the best available
            topProspects.sort((a, b) => a.overallRank - b.overallRank);
            const selectedPlayer = topProspects[0];
            console.log('AI selected top prospect:', selectedPlayer.name);
            
            // Add pick to draft board with all player data
            draftPicks.push({
                team: team.name,
                name: selectedPlayer.name,
                position: selectedPlayer.position,
                school: selectedPlayer.school,
                rank: selectedPlayer.rank,
                height: selectedPlayer.height,
                weight: selectedPlayer.weight
            });
            
            // Remove player from available players
            availablePlayers = availablePlayers.filter(p => p.name !== selectedPlayer.name);
            
            // Update UI
            updateDraftBoard();
            updateAvailablePlayersTable();
            updateDraftStatus();
            currentPick++;
            return;
        }
        
        // If no top prospects, proceed with team needs
        const availablePlayersForTeam = availablePlayers.filter(player => 
            teamNeeds.includes(player.position)
        );
        
        if (availablePlayersForTeam.length > 0) {
            // Sort by position rank and pick the best available
            availablePlayersForTeam.sort((a, b) => a.rank - b.rank);
            const selectedPlayer = availablePlayersForTeam[0];
            console.log('AI selected player:', selectedPlayer.name);
            
            // Add pick to draft board with all player data
            draftPicks.push({
                team: team.name,
                name: selectedPlayer.name,
                position: selectedPlayer.position,
                school: selectedPlayer.school,
                rank: selectedPlayer.rank,
                height: selectedPlayer.height,
                weight: selectedPlayer.weight
            });
            
            // Remove player from available players
            availablePlayers = availablePlayers.filter(p => p.name !== selectedPlayer.name);
            
            // Update UI
            updateDraftBoard();
            updateAvailablePlayersTable();
            updateDraftStatus();
        } else {
            console.log('No available players for team needs:', teamNeeds);
        }
        currentPick++;
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

    function updateDraftBoard(forceShowAll = false) {
        console.log('Updating draft board with picks:', draftPicks);
        draftBoard.innerHTML = '';
        if (draftPicks.length === 0) {
            draftBoard.innerHTML = '<div class="text-center text-gray-500 py-8">Select a team to start your mock draft</div>';
            return;
        }

        // Show only the most recent 10 picks by default
        const recentPicks = draftPicks.slice(-10);
        const shouldShowAll = forceShowAll || draftPicks.length <= 10;

        // Add "View All" button if there are more than 10 picks
        if (!shouldShowAll) {
            const viewAllButton = document.createElement('button');
            viewAllButton.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-4';
            viewAllButton.textContent = 'View All Picks';
            viewAllButton.onclick = () => {
                updateDraftBoard(true);
            };
            draftBoard.appendChild(viewAllButton);
        }

        // Create the picks container
        const picksContainer = document.createElement('div');
        picksContainer.className = 'space-y-2';

        // Show either all picks or just recent ones
        const picksToShow = shouldShowAll ? draftPicks : recentPicks;
        
        picksToShow.forEach((pick, index) => {
            const pickElement = document.createElement('div');
            pickElement.className = 'flex items-center justify-between p-4 border-b';
            const isUserPick = pick.team === currentTeam;
            const actualIndex = shouldShowAll ? index : draftPicks.length - 10 + index;
            pickElement.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="font-semibold">${actualIndex + 1}.</span>
                    <span class="${isUserPick ? 'text-blue-600 font-semibold' : ''}">${pick.team}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span>${pick.name}</span>
                    <span class="text-gray-600">${pick.position}</span>
                    <span class="text-gray-600">${pick.school}</span>
                </div>
                ${isUserPick ? `
                    <button onclick="removePick(${actualIndex})" class="text-red-600 hover:text-red-800">
                        Remove
                    </button>
                ` : ''}
            `;
            picksContainer.appendChild(pickElement);
        });

        draftBoard.appendChild(picksContainer);
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
            // Clear existing content
            teamInfo.innerHTML = '';
            
            // Add basic team info
            const teamInfoContent = document.createElement('div');
            teamInfoContent.innerHTML = `
                <h2 class="text-xl font-bold mb-4">${team.name}</h2>
                <p class="text-gray-600 mb-2">Pick #${team.pick}</p>
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Team Needs:</h3>
                    <div class="flex flex-wrap gap-2">
                        ${team.needs.map(need => 
                            `<span class="bg-gray-200 px-2 py-1 rounded text-sm">${need}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
            teamInfo.appendChild(teamInfoContent);

            // Add "Your Picks" section
            const userPicks = draftPicks.filter(pick => pick.team === currentTeam);
            if (userPicks.length > 0) {
                const yourPicksSection = document.createElement('div');
                yourPicksSection.className = 'mt-6';
                yourPicksSection.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2">Your Picks</h3>
                    <div class="space-y-2">
                        ${userPicks.map((pick, index) => `
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div class="flex items-center gap-4">
                                    <span class="font-semibold">${index + 1}.</span>
                                    <span>${pick.name}</span>
                                    <span class="text-gray-600">${pick.position}</span>
                                    <span class="text-gray-600">${pick.school}</span>
                                </div>
                                <button onclick="removePick(${draftPicks.indexOf(pick)})" class="text-red-600 hover:text-red-800">
                                    Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
                teamInfo.appendChild(yourPicksSection);
            }

            // Add "Team Picks" section showing all teams' selections
            const teamPicksSection = document.createElement('div');
            teamPicksSection.className = 'mt-6';
            teamPicksSection.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">Team Picks</h3>
                <div class="space-y-4">
                    ${teams.map(team => {
                        const teamPicks = draftPicks.filter(pick => pick.team === team.name);
                        return `
                            <div class="bg-gray-50 p-3 rounded">
                                <h4 class="font-semibold mb-2">${team.name}</h4>
                                <div class="space-y-2">
                                    ${teamPicks.map((pick, index) => `
                                        <div class="flex items-center gap-4 text-sm">
                                            <span class="font-medium">${index + 1}.</span>
                                            <span>${pick.name}</span>
                                            <span class="text-gray-600">${pick.position}</span>
                                            <span class="text-gray-600">${pick.school}</span>
                                        </div>
                                    `).join('')}
                                    ${teamPicks.length === 0 ? '<p class="text-gray-500 text-sm">No picks yet</p>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            teamInfo.appendChild(teamPicksSection);
        }
    }

    function simulateAIPicks() {
        console.log('=== IN SIMULATE AI PICKS ===');
        console.log('Current state:', { currentPick, isUserTurn });
        
        // Find the current team's next pick
        const currentTeamData = teams.find(t => t.name === currentTeam);
        if (!currentTeamData) {
            console.error('No team data found for:', currentTeam);
            return;
        }
        
        // Calculate next user pick based on current round
        const currentRound = Math.ceil(currentPick / 32);
        const nextUserPick = currentTeamData.pick + ((currentRound) * 32);
        console.log('Current pick:', currentPick, 'Current round:', currentRound, 'Next user pick:', nextUserPick);
        
        // If we've reached the end of the draft (7 rounds * 32 picks = 224)
        if (currentPick > 224) {
            console.log('End of draft reached');
            return;
        }
        
        console.log('Calling simulateNextAIPicks...');
        // Simulate AI picks until next user pick
        simulateNextAIPicks(nextUserPick);
    }

    function simulateNextAIPicks(nextUserPick) {
        console.log('=== IN SIMULATE NEXT AI PICKS ===');
        console.log('Current state:', { currentPick, isUserTurn, nextUserPick });
        
        if (currentPick >= nextUserPick) {
            console.log('Reached user pick, setting isUserTurn to true');
            isUserTurn = true;
            updateDraftStatus();
            return;
        }

        // Calculate the current round and pick within that round
        const currentRound = Math.ceil(currentPick / 32);
        const pickInRound = ((currentPick - 1) % 32) + 1;
        console.log('Current round:', currentRound, 'Pick in round:', pickInRound);

        // Find the team whose pick it is in this round
        const team = teams.find(t => t.pick === pickInRound);
        
        if (team) {
            console.log('Found team for pick:', team.name, 'in round', currentRound);
            makeAIPick(team);
        } else {
            console.log('No team found for pick:', currentPick, 'in round', currentRound);
            currentPick++;
        }
        
        console.log('Setting up next AI pick...');
        // Use setTimeout to prevent UI freezing
        setTimeout(() => {
            console.log('Calling simulateNextAIPicks again...');
            simulateNextAIPicks(nextUserPick);
        }, 100);
    }

    // Global functions for draft actions
    window.draftPlayer = function(name, position, school) {
        console.log('=== STARTING DRAFT PLAYER ===');
        console.log('Drafting player:', { name, position, school });
        console.log('Current state:', { currentTeam, currentPick, isUserTurn });
        
        if (!currentTeam) {
            alert('Please select a team first');
            return;
        }
        if (!isUserTurn) {
            alert('It\'s not your turn to pick yet!');
            return;
        }
        
        // Find the player in availablePlayers to get all their data
        const player = availablePlayers.find(p => p.name === name);
        if (!player) {
            console.error('Player not found in availablePlayers:', name);
            return;
        }
        
        // Add pick to draft board with all player data
        draftPicks.push({
            team: currentTeam,
            name: player.name,
            position: player.position,
            school: player.school,
            rank: player.rank,
            height: player.height,
            weight: player.weight
        });
        
        // Remove the selected player from available players
        availablePlayers = availablePlayers.filter(p => p.name !== name);
        
        // Update UI
        updateDraftBoard();
        updateAvailablePlayersTable();
        updateTeamInfo();
        
        // Move to next pick and continue simulation
        currentPick++;
        isUserTurn = false;
        updateDraftStatus();
        
        console.log('State after user pick:', { currentPick, isUserTurn });
        console.log('Calling simulateAIPicks...');
        
        // Simulate next AI picks
        setTimeout(() => {
            console.log('=== STARTING AI PICKS ===');
            simulateAIPicks();
        }, 100);
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