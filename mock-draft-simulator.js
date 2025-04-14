// Mock Draft Simulator
console.log('Mock Draft Simulator script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Initialize state
    let currentDraft = {
        team: null,
        picks: [],
        availablePlayers: []
    };

    // DOM Elements
    const teamSelect = document.getElementById('team-select');
    const startDraftBtn = document.getElementById('start-draft');
    const saveDraftBtn = document.getElementById('save-draft');
    const resetDraftBtn = document.getElementById('reset-draft');
    const playerSearch = document.getElementById('player-search');
    const draftBoard = document.getElementById('draft-board');
    const availablePlayersTable = document.getElementById('available-players');
    const teamInfo = document.getElementById('team-info');
    const teamLogo = document.getElementById('team-logo');
    const teamName = document.getElementById('team-name');
    const teamPick = document.getElementById('team-pick');
    const teamNeeds = document.getElementById('team-needs');

    console.log('DOM Elements:', {
        teamSelect,
        startDraftBtn,
        saveDraftBtn,
        resetDraftBtn,
        playerSearch,
        draftBoard,
        availablePlayersTable,
        teamInfo,
        teamLogo,
        teamName,
        teamPick,
        teamNeeds
    });

    // Load teams data
    fetch('data/teams.json')
        .then(response => {
            console.log('Teams response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Teams data:', data);
            data.teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.name;
                option.textContent = team.name;
                teamSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading teams:', error));

    // Load players data
    fetch('data/player-profiles-v2.json')
        .then(response => {
            console.log('Players response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Players data:', data);
            currentDraft.availablePlayers = data.players.map(player => ({
                name: player.name,
                position: player.position,
                school: player.school,
                rank: player.rank,
                description: player.description
            }));
            updateAvailablePlayersTable();
        })
        .catch(error => console.error('Error loading players:', error));

    // Event Listeners
    startDraftBtn.addEventListener('click', startDraft);
    saveDraftBtn.addEventListener('click', saveDraft);
    resetDraftBtn.addEventListener('click', resetDraft);
    playerSearch.addEventListener('input', filterPlayers);
    teamSelect.addEventListener('change', updateTeamInfo);

    // Functions
    function startDraft() {
        console.log('Start Draft clicked');
        if (!currentDraft.team) {
            alert('Please select a team first');
            return;
        }
        currentDraft.picks = [];
        updateDraftBoard();
        updateAvailablePlayersTable();
    }

    function saveDraft() {
        console.log('Save Draft clicked');
        if (currentDraft.picks.length === 0) {
            alert('No picks to save');
            return;
        }
        const draftData = {
            team: currentDraft.team,
            picks: currentDraft.picks,
            date: new Date().toISOString()
        };
        localStorage.setItem('savedDraft', JSON.stringify(draftData));
        alert('Draft saved successfully!');
    }

    function resetDraft() {
        console.log('Reset Draft clicked');
        if (confirm('Are you sure you want to reset the draft?')) {
            currentDraft.picks = [];
            currentDraft.availablePlayers = [...currentDraft.availablePlayers, ...currentDraft.picks];
            updateDraftBoard();
            updateAvailablePlayersTable();
        }
    }

    function filterPlayers() {
        console.log('Filter Players:', playerSearch.value);
        const searchTerm = playerSearch.value.toLowerCase();
        const filteredPlayers = currentDraft.availablePlayers.filter(player => 
            player.name.toLowerCase().includes(searchTerm) ||
            player.position.toLowerCase().includes(searchTerm) ||
            player.school.toLowerCase().includes(searchTerm)
        );
        updateAvailablePlayersTable(filteredPlayers);
    }

    function updateTeamInfo() {
        console.log('Update Team Info:', teamSelect.value);
        const selectedTeam = teamSelect.value;
        if (!selectedTeam) {
            teamInfo.classList.add('hidden');
            return;
        }

        fetch('data/teams.json')
            .then(response => response.json())
            .then(data => {
                const team = data.teams.find(t => t.name === selectedTeam);
                if (team) {
                    teamLogo.src = `images/logos/nfl/${team.name.toLowerCase().replace(/\s+/g, '-')}.png`;
                    teamName.textContent = team.name;
                    teamPick.textContent = `Pick #${team.pick}`;
                    teamNeeds.innerHTML = team.needs.map(need => 
                        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">${need}</span>`
                    ).join('');
                    teamInfo.classList.remove('hidden');
                    currentDraft.team = team.name;
                }
            })
            .catch(error => console.error('Error loading team info:', error));
    }

    function updateDraftBoard() {
        console.log('Update Draft Board:', currentDraft.picks);
        draftBoard.innerHTML = currentDraft.picks.length === 0 ? 
            '<div class="text-center text-gray-500 py-8">Select a team to start your mock draft</div>' :
            currentDraft.picks.map((pick, index) => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                        <span class="text-gray-500 mr-4">${index + 1}</span>
                        <div>
                            <h4 class="font-semibold">${pick.name}</h4>
                            <p class="text-sm text-gray-600">${pick.position} - ${pick.school}</p>
                        </div>
                    </div>
                    <button onclick="removePick(${index})" class="text-red-500 hover:text-red-700">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `).join('');
    }

    function updateAvailablePlayersTable(players = currentDraft.availablePlayers) {
        console.log('Update Available Players:', players);
        availablePlayersTable.innerHTML = players.map(player => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">${player.rank}</td>
                <td class="px-4 py-3">${player.name}</td>
                <td class="px-4 py-3">${player.position}</td>
                <td class="px-4 py-3">${player.school}</td>
                <td class="px-4 py-3">
                    <button onclick="draftPlayer('${player.name}')" 
                            class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                        Draft
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Global functions for button clicks
    window.draftPlayer = function(playerName) {
        console.log('Draft Player:', playerName);
        const player = currentDraft.availablePlayers.find(p => p.name === playerName);
        if (player) {
            currentDraft.picks.push(player);
            currentDraft.availablePlayers = currentDraft.availablePlayers.filter(p => p.name !== playerName);
            updateDraftBoard();
            updateAvailablePlayersTable();
        }
    };

    window.removePick = function(index) {
        console.log('Remove Pick:', index);
        const pick = currentDraft.picks[index];
        currentDraft.picks.splice(index, 1);
        currentDraft.availablePlayers.push(pick);
        updateDraftBoard();
        updateAvailablePlayersTable();
    };
}); 