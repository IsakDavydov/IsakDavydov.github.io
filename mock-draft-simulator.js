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

    // Add event listener for position filter
    document.getElementById('position-filter').addEventListener('change', () => {
        filterPlayers();
    });

    // Add event listener for simulate rest button
    document.getElementById('simulate-rest').addEventListener('click', () => {
        console.log('Simulate rest button clicked');
        simulateRest();
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
        
        // Special handling for top 3 picks
        if (currentPick === 1) {
            // Always take Cam Ward at #1
            const targetPlayer = availablePlayers.find(p => p.name === "Cam Ward");
            if (targetPlayer) {
                draftPicks.push({
                    team: team.name,
                    name: targetPlayer.name,
                    position: targetPlayer.position,
                    school: targetPlayer.school,
                    rank: targetPlayer.rank,
                    height: targetPlayer.height,
                    weight: targetPlayer.weight
                });
                availablePlayers = availablePlayers.filter(p => p.name !== targetPlayer.name);
                updateDraftBoard();
                updateAvailablePlayersTable();
                updateDraftStatus();
                currentPick++;
                return;
            }
        } else if (currentPick === 2 || currentPick === 3) {
            // For picks 2-3, alternate between Hunter and Carter
            const targetPlayers = ["Travis Hunter", "Abdul Carter"];
            const targetPlayer = availablePlayers.find(p => targetPlayers.includes(p.name));
            if (targetPlayer) {
                draftPicks.push({
                    team: team.name,
                    name: targetPlayer.name,
                    position: targetPlayer.position,
                    school: targetPlayer.school,
                    rank: targetPlayer.rank,
                    height: targetPlayer.height,
                    weight: targetPlayer.weight
                });
                availablePlayers = availablePlayers.filter(p => p.name !== targetPlayer.name);
                updateDraftBoard();
                updateAvailablePlayersTable();
                updateDraftStatus();
                currentPick++;
                return;
            }
        }

        // For picks 4-32 (first round)
        if (currentPick <= 32) {
            const topPlayers = availablePlayers
                .filter(p => p.overallRank <= 32)
                .sort((a, b) => a.overallRank - b.overallRank);
            
            if (topPlayers.length > 0) {
                // Add more randomness to first round picks
                const random = Math.random();
                let selectedPlayer;
                if (random < 0.6) {
                    selectedPlayer = topPlayers[0];  // 60% chance to take best available
                } else if (random < 0.85) {
                    selectedPlayer = topPlayers[1] || topPlayers[0];  // 25% chance to take second best
                } else {
                    selectedPlayer = topPlayers[2] || topPlayers[0];  // 15% chance to take third best
                }
                
                draftPicks.push({
                    team: team.name,
                    name: selectedPlayer.name,
                    position: selectedPlayer.position,
                    school: selectedPlayer.school,
                    rank: selectedPlayer.rank,
                    height: selectedPlayer.height,
                    weight: selectedPlayer.weight
                });
                availablePlayers = availablePlayers.filter(p => p.name !== selectedPlayer.name);
                updateDraftBoard();
                updateAvailablePlayersTable();
                updateDraftStatus();
                currentPick++;
                return;
            }
        }

        // For picks 33+ (later rounds)
        const availableForPosition = availablePlayers.filter(player => {
            return teamNeeds.includes(player.position) || 
                   (player.position === "OG" && teamNeeds.includes("IOL")) ||
                   ((player.position === "DT" || player.position === "EDGE") && teamNeeds.includes("DL"));
        });

        if (availableForPosition.length > 0) {
            // Sort by position rank and add randomness
            availableForPosition.sort((a, b) => a.rank - b.rank);
            
            const random = Math.random();
            let selectedPlayer;
            if (random < 0.5) {
                selectedPlayer = availableForPosition[0];  // 50% chance to take best at position
            } else if (random < 0.8) {
                selectedPlayer = availableForPosition[1] || availableForPosition[0];  // 30% chance to take second best
            } else {
                selectedPlayer = availableForPosition[2] || availableForPosition[0];  // 20% chance to take third best
            }
            
            draftPicks.push({
                team: team.name,
                name: selectedPlayer.name,
                position: selectedPlayer.position,
                school: selectedPlayer.school,
                rank: selectedPlayer.rank,
                height: selectedPlayer.height,
                weight: selectedPlayer.weight
            });
            availablePlayers = availablePlayers.filter(p => p.name !== selectedPlayer.name);
            updateDraftBoard();
            updateAvailablePlayersTable();
            updateDraftStatus();
            currentPick++;
            return;
        }

        // If no players match team needs, take best available
        const bestAvailable = availablePlayers[0];
        if (bestAvailable) {
            draftPicks.push({
                team: team.name,
                name: bestAvailable.name,
                position: bestAvailable.position,
                school: bestAvailable.school,
                rank: bestAvailable.rank,
                height: bestAvailable.height,
                weight: bestAvailable.weight
            });
            availablePlayers = availablePlayers.filter(p => p.name !== bestAvailable.name);
            updateDraftBoard();
            updateAvailablePlayersTable();
            updateDraftStatus();
            currentPick++;
        }
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
        const positionFilter = document.getElementById('position-filter').value;
        
        const filteredPlayers = availablePlayers.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchTerm) ||
                                player.position.toLowerCase().includes(searchTerm) ||
                                player.school.toLowerCase().includes(searchTerm);
            const matchesPosition = !positionFilter || player.position === positionFilter;
            return matchesSearch && matchesPosition;
        });
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
        const tbody = availablePlayersTable.querySelector('tbody');
        if (!tbody) {
            console.error('Table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        players.forEach(player => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-100';
            
            row.innerHTML = `
                <td class="px-4 py-2">${player.rank}</td>
                <td class="px-4 py-2">${player.name}</td>
                <td class="px-4 py-2">${player.position}</td>
                <td class="px-4 py-2">${player.school}</td>
                <td class="px-4 py-2">
                    <button onclick="draftPlayer('${player.name}')" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        Draft
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
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
            } else {
                const noPicksSection = document.createElement('div');
                noPicksSection.className = 'mt-6';
                noPicksSection.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2">Your Picks</h3>
                    <p class="text-gray-500">No picks yet</p>
                `;
                teamInfo.appendChild(noPicksSection);
            }
        }
    }

    function simulateAIPicks() {
        console.log('=== IN SIMULATE AI PICKS ===');
        console.log('Current state:', { currentPick, isUserTurn });
        
        // If we've reached the end of the draft (257 total picks)
        if (currentPick > 257) {
            console.log('End of draft reached');
            endDraft();
            return;
        }
        
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
        
        console.log('Calling simulateNextAIPicks...');
        // Simulate AI picks until next user pick
        simulateNextAIPicks(nextUserPick);
    }

    function endDraft() {
        console.log('Ending draft and calculating grade');
        isUserTurn = false;
        updateDraftStatus();
        
        // Get all user picks
        const userPicks = draftPicks.filter(pick => pick.team === currentTeam);
        
        // Calculate grade based on picks
        let totalScore = 0;
        const pickGrades = userPicks.map((pick, index) => {
            // Base score is 100 minus the pick number
            let score = 100 - (index + 1);
            
            // Bonus points for top prospects
            if (pick.overallRank <= 5) {
                score += 20;
            }
            
            // Bonus points for filling team needs
            const team = teams.find(t => t.name === currentTeam);
            const mappedNeeds = team.needs.map(need => {
                if (need === 'IOL') return ['OG', 'C'];
                if (need === 'DL') return ['DT', 'DE'];
                return [need];
            }).flat();
            
            if (mappedNeeds.includes(pick.position)) {
                score += 10;
            }
            
            totalScore += score;
            
            return {
                pick: index + 1,
                player: pick.name,
                position: pick.position,
                school: pick.school,
                score: score
            };
        });
        
        // Calculate final grade
        const averageScore = totalScore / userPicks.length;
        let grade = 'F';
        if (averageScore >= 90) grade = 'A';
        else if (averageScore >= 80) grade = 'B';
        else if (averageScore >= 70) grade = 'C';
        else if (averageScore >= 60) grade = 'D';
        
        // Create and show modal
        const modal = document.createElement('div');
        modal.id = 'draft-results-modal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative p-6 bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">Draft Results</h2>
                    <button onclick="document.getElementById('draft-results-modal').remove()" 
                            class="text-gray-500 hover:text-gray-700">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xl font-semibold">Final Grade: ${grade}</h3>
                        <span class="text-lg text-gray-600">Average Score: ${averageScore.toFixed(1)}</span>
                    </div>
                    <p class="text-gray-600 text-sm">${getGradeDescription(grade)}</p>
                </div>
                
                <div class="max-h-[60vh] overflow-y-auto">
                    <h3 class="text-lg font-semibold mb-3">Your Picks:</h3>
                    <div class="space-y-3">
                        ${pickGrades.map(pick => `
                            <div class="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <span class="font-semibold">${pick.pick}.</span>
                                        <span class="ml-2">${pick.player}</span>
                                        <span class="text-gray-600 ml-2">${pick.position}</span>
                                        <span class="text-gray-600 ml-2">${pick.school}</span>
                                    </div>
                                    <span class="font-semibold">Score: ${pick.score}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Disable draft controls
        startDraftBtn.disabled = true;
        saveDraftBtn.disabled = true;
        playerSearch.disabled = true;
    }

    function getGradeDescription(grade) {
        switch(grade) {
            case 'A':
                return 'Excellent draft! You selected top prospects and filled key team needs.';
            case 'B':
                return 'Good draft! You made solid picks that should help your team.';
            case 'C':
                return 'Average draft. Some good picks but room for improvement.';
            case 'D':
                return 'Below average draft. Consider focusing more on team needs and top prospects.';
            default:
                return 'Poor draft. Try focusing on team needs and top prospects next time.';
        }
    }

    async function simulateNextAIPicks(nextUserPick) {
        console.log('=== IN SIMULATE NEXT AI PICKS ===');
        console.log('Current state:', { currentPick, isUserTurn, nextUserPick });
        
        // Check if we've reached the end of the draft (pick 257)
        if (currentPick > 257) {
            console.log('Draft complete - reached pick 257');
            endDraft();
            return;
        }

        // If it's the user's turn, stop and wait for their pick
        if (isUserTurn) {
            console.log('Reached user pick, setting isUserTurn to true');
            return;
        }

        if (currentPick >= nextUserPick) {
            console.log('Reached user pick, setting isUserTurn to true');
            isUserTurn = true;
            updateDraftStatus();
            return;
        }

        // Find the team whose pick it is
        const currentRound = Math.ceil(currentPick / 32);
        const pickInRound = currentPick % 32 || 32; // Get pick number within current round (1-32)
        const team = teams.find(t => t.pick === pickInRound);
        
        if (team) {
            console.log('Found team for pick:', team.name, 'at pick', currentPick);
            makeAIPick(team);
        } else {
            console.log('No team found for pick:', currentPick);
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
    window.draftPlayer = function(playerName) {
        console.log('=== STARTING DRAFT PLAYER ===');
        console.log('Drafting player:', { playerName });
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
        const player = availablePlayers.find(p => p.name === playerName);
        if (!player) {
            console.error('Player not found in availablePlayers:', playerName);
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
        availablePlayers = availablePlayers.filter(p => p.name !== playerName);
        
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

    function simulateRest() {
        if (!currentTeam) {
            alert('Please select a team and start the draft first');
            return;
        }

        // Disable buttons during simulation
        document.getElementById('simulate-rest').disabled = true;
        document.getElementById('start-draft').disabled = true;
        document.getElementById('save-draft').disabled = true;
        document.getElementById('reset-draft').disabled = true;

        // Update status
        draftStatus.textContent = 'Simulating rest of draft...';
        draftStatus.classList.remove('hidden');

        function simulateNextPick() {
            if (currentPick > 257) {
                // Draft is complete
                draftStatus.textContent = 'Draft Complete!';
                document.getElementById('simulate-rest').disabled = false;
                document.getElementById('start-draft').disabled = false;
                document.getElementById('save-draft').disabled = false;
                document.getElementById('reset-draft').disabled = false;
                return;
            }

            const team = teams.find(t => t.pick === currentPick);
            if (team) {
                if (team.name === currentTeam) {
                    // It's user's turn - pick best available player
                    const bestPlayer = availablePlayers[0];
                    if (bestPlayer) {
                        draftPicks.push({
                            team: team.name,
                            name: bestPlayer.name,
                            position: bestPlayer.position,
                            school: bestPlayer.school,
                            rank: bestPlayer.rank,
                            height: bestPlayer.height,
                            weight: bestPlayer.weight
                        });
                        availablePlayers = availablePlayers.filter(p => p.name !== bestPlayer.name);
                        updateDraftBoard();
                        updateAvailablePlayersTable();
                    }
                } else {
                    // AI's turn
                    makeAIPick(team);
                }
            }
            
            currentPick++;
            updateDraftStatus();
            
            // Continue simulation with a small delay
            setTimeout(simulateNextPick, 50);
        }

        // Start simulation
        simulateNextPick();
    }
}); 