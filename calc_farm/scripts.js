var CALCFARM_YOURTEAM = [];
var CALCFARM_YOURTEAM_DISPLAY = [];  // similar to CURRENT_SIDEBARS storing only base form names
var CALCFARM_YOURTEAM_DISPLAY_NAMES = [];

var CALCFARM_TARGETS = [];
var CALCFARM_OFFENSIVE_RESULTS = {};
var CALCFARM_DEFENSIVE_RESULTS = {};

function cfLoadYourTeam() {
    var yourTeamSets = saveCalcFarmSetsAs('calcfarm_yourteam', 'cfInputYourTeam');

    for (var j = 0; j < yourTeamSets.length; ++j) {
        CALCFARM_YOURTEAM_DISPLAY[j] = yourTeamSets[j][0];
        CALCFARM_YOURTEAM_DISPLAY_NAMES[j] = yourTeamSets[j][1];

        var fullName = yourTeamSets[j][0] + ' (' + yourTeamSets[j][1] + ')';
        loadPreset('#p1', fullName);  // update sidebar left
        var p1 = new Pokemon($("#p1"));
        p1.shortName = headerName(p1);
        CALCFARM_OFFENSIVE_RESULTS[p1.shortName] = [];
        CALCFARM_DEFENSIVE_RESULTS[p1.shortName] = [];
        CALCFARM_YOURTEAM.push(p1);
    }
    reloadYourTeamDisplay();
    console.log('Done loading Your Team.');
}

// similar to reloadSidebar in sidebars.js
function reloadYourTeamDisplay() {
    var displayName, teamslot;
    for (var i = 0; i < CALCFARM_YOURTEAM_DISPLAY.length; i++) {
        displayName = CALCFARM_YOURTEAM_DISPLAY[i];
        teamslot = '#pkmnC' + (i + 1);
        $(teamslot).prop('title', displayName);
        getSidebarImg(teamslot + 'I', displayName);
        // $('#c' + (i + 1)).show();  // look for div element with id #c(i+1)
    }
}

// similar to loadSidebarSlot in sidebars.js
function cfSelectYourTeamSlot(teamnum) {
    var speciesName = CALCFARM_YOURTEAM_DISPLAY[teamnum - 1];
    var setName = CALCFARM_YOURTEAM_DISPLAY_NAMES[teamnum - 1];
    if (speciesName in pokedex) {
        var slotName = speciesName + ' (' + setName + ')';
        loadPreset('#p1', slotName);  // always load on left sidebar (p1)
    }
}


const targetOpponentsLists = {
    champs_regMB: opponents_champs_reg_mb,
    champs_regMA: opponents_champs_reg_ma,
    sv_regI: opponents_sv_reg_i,
    sv_regG: opponents_sv_reg_g
};

function cfPopulateTargetsList() {
    const value = document.getElementById("populateDropdown").value;

    if (targetOpponentsLists[value]) {
        $('#cfInputTargetOpponents').val(targetOpponentsLists[value]);
    }
}

function cfLoadTargetOpponents() {
    var targetSets = saveCalcFarmSetsAs('calcfarm_targets', 'cfInputTargetOpponents');

    for (var j = 0; j < targetSets.length; ++j) {
        var fullName = targetSets[j][0] + ' (' + targetSets[j][1] + ')';
        loadPreset('#p2', fullName);  // update sidebar right
        var p2 = new Pokemon($("#p2"));
        p2.shortName = headerName(p2);
        CALCFARM_TARGETS.push(p2);
    }
    console.log('Done loading targets.');
}


// Returns a string that captures the amount of investment into `statName`, accounting for both
// the number of EVs in the stat (`evs`) and the nature (`nature`). e.g., "252+" for attack for
// a max investment Adamant pokemon.
function evString(evs, nature, statName) {
    var natureMods = NATURES[nature];
    return evs + (natureMods[0] === statName ? '+' : natureMods[1] === statName ? '-' : '');
}

// Returns a summary string describing the pokemon `p`, in the form
// "Incineroar@Sitrus Berry 236/44/20/0-/124+/84".
function headerName(p) {
    if (gen == 10) {
        return p.name + '@' + p.item + ' ' + p.HPSPs + '/' + [evString(p.sps.at, p.nature, 'at'), 
                                                              evString(p.sps.df, p.nature, 'df'),
                                                              evString(p.sps.sa, p.nature, 'sa'),
                                                              evString(p.sps.sd, p.nature, 'sd'),
                                                              evString(p.sps.sp, p.nature, 'sp')].join('/');
    } else {
        return p.name + '@' + p.item + ' ' + p.HPEVs + '/' + [evString(p.evs.at, p.nature, 'at'), 
                                                              evString(p.evs.df, p.nature, 'df'),
                                                              evString(p.evs.sa, p.nature, 'sa'),
                                                              evString(p.evs.sd, p.nature, 'sd'),
                                                              evString(p.evs.sp, p.nature, 'sp')].join('/');  
    }

}

// Reads in the sets given by the user on both sides, runs all calculations, and generates
// the CSV that summarizes the results.
function GenerateCsv() {
    let offensiveResults = CALCFARM_OFFENSIVE_RESULTS;
    let defensiveResults = CALCFARM_DEFENSIVE_RESULTS;

    cfLoadYourTeam();  // for now auto-update with latest input in case of changes
    let leftPokemon = CALCFARM_YOURTEAM;

    cfLoadTargetOpponents();  // load targets before running calcs
    let rightPokemon = CALCFARM_TARGETS;

    var field = new Field();
    // Clear weather and terrain, otherwise all calculations are performed using the
    // weather/terrain that was entered into the form when this function was called.
    field.clearWeather();
    field.clearTerrain();
    for (var i = 0; i < leftPokemon.length; ++i) {
        for (var j = 0; j < rightPokemon.length; ++j) {
            // Clear all boosts before calculating, as the way we load Pokemon may lead to
            // boosts being saved into leftPokemon or rightPokemon.
            leftPokemon[i].boosts.at = 0;
            leftPokemon[i].boosts.df = 0;
            leftPokemon[i].boosts.sa = 0;
            leftPokemon[i].boosts.sd = 0;
            leftPokemon[i].boosts.sp = 0;
            rightPokemon[j].boosts.at = 0;
            rightPokemon[j].boosts.df = 0;
            rightPokemon[j].boosts.sa = 0;
            rightPokemon[j].boosts.sd = 0;
            rightPokemon[j].boosts.sp = 0;
            damageResults = CALCULATE_ALL_MOVES_WITHOUT_ABILITIES_SV(leftPokemon[i], rightPokemon[j], field);

            // Gather the offensive calc results.
            for (var m = 0; m < 4; ++m) {
                result = damageResults[0][m];
                [minDamage, maxDamage] = calcMinMaxDamage(result.damage, leftPokemon[i].moves[m].hits);
                minPercent = Math.floor(minDamage * 1000 / rightPokemon[j].maxHP) / 10;
                maxPercent = Math.floor(maxDamage * 1000 / rightPokemon[j].maxHP) / 10;
                // TODO(tblock007): Consider conveying the number of hits in the move name for multi-hit moves.
                // TODO(tblock007): Consider keeping min and max separate so they remain numeric values instead of a single string representing a range.
                offensiveResults[leftPokemon[i].shortName].push([leftPokemon[i].moves[m].name, rightPokemon[j].shortName, minPercent + " - " + maxPercent]);
            }

            // Gather the defensive calc results.
            for (var m = 0; m < 4; ++m) {
                result = damageResults[1][m];
                [minDamage, maxDamage] = calcMinMaxDamage(result.damage, rightPokemon[j].moves[m].hits);
                minPercent = Math.floor(minDamage * 1000 / leftPokemon[i].maxHP) / 10;
                maxPercent = Math.floor(maxDamage * 1000 / leftPokemon[i].maxHP) / 10;
                defensiveResults[leftPokemon[i].shortName].push([rightPokemon[j].moves[m].name, rightPokemon[j].shortName, minPercent + " - " + maxPercent]);
            }
        }
        console.log('Done computing for ' + leftPokemon[i].shortName);
    }

    let csv = "";
    for (let p in offensiveResults) {
        csv += "OFFENSIVE: " + p + "\n";
        csv += (['', offensiveResults[p][0][0], offensiveResults[p][1][0], offensiveResults[p][2][0], offensiveResults[p][3][0]].join(',') + '\n');
        let i = 0;
        while (i < offensiveResults[p].length) {
            csv += [offensiveResults[p][i][1], offensiveResults[p][i][2], offensiveResults[p][i+1][2], offensiveResults[p][i+2][2], offensiveResults[p][i+3][2]].join(',') + '\n';
            i += 4;
        }
        csv += '\n';

        csv += "DEFENSIVE: " + p + "\n";
        csv += '\n';

        // gather all the defensive calcs sorted by move which does the most damage first
        const chunks = [];
        i = 0;
        while (i < defensiveResults[p].length) {
            const chunk = defensiveResults[p].slice(i, i + 4);

            chunk.sort((a, b) => {
                const getMin = str => parseInt(str.split(' - ')[0], 10);
                return getMin(b[2]) - getMin(a[2]);
            });

            if (chunk.length === 4) {
                chunks.push(chunk);
            }
            // csv += [defensiveResults[p][i][1], defensiveResults[p][i][0], defensiveResults[p][i][2], defensiveResults[p][i+1][0], defensiveResults[p][i+1][2], defensiveResults[p][i+2][0], defensiveResults[p][i+2][2], defensiveResults[p][i+3][0], defensiveResults[p][i+3][2], ].join(',') + '\n';
            i += 4;
        }

        // sort mons by strongest damage calc
        chunks.sort((a, b) => {
            const getMin = str => parseFloat(str.split(' - ')[0], 10);
            return getMin(b[0][2]) - getMin(a[0][2]); // descending
        });

        // then print output
        for (const chunk of chunks) {
            csv += [
                chunk[0][1], chunk[0][0], chunk[0][2],
                chunk[1][0], chunk[1][2],
                chunk[2][0], chunk[2][2],
                chunk[3][0], chunk[3][2],
            ].join(',') + '\n';
        }
        csv += '\n************************************************************\n\n';
    }
    $('#csvResults').val(csv);

    var data = 'data:application/csv;carset=utf-8,' + encodeURIComponent(csv);
    var exportLink = document.createElement('a');
    exportLink.setAttribute('href', data);
    exportLink.setAttribute('download', 'calcs.csv');
    exportLink.setAttribute('target', '_blank');
    exportLink.appendChild(document.createTextNode('Download as calcs.csv'));
    $('#csvResultsLink').html(exportLink);

    alert('CSV has been written to the results text box!\n\nCopy it into a .csv file and then import into Google Sheets for easier viewing.');
}

// Saves all pokemon entered into the `source` text as custom sets "{category} #{index}".
function saveCalcFarmSetsAs(category, source, sidebarUsed = 0) {
    var string = document.getElementById(source).value;
    var sets = processSave(string, category, sidebarUsed, undefined, true); // Logic follows processSave()
    return sets;
}
