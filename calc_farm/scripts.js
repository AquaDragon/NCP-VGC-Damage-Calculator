const targetOpponentsLists = {
    champs_regMB: opponents_champs_reg_mb,
    champs_regMA: opponents_champs_reg_ma,
    sv_regI: opponents_sv_reg_i,
    sv_regG: opponents_sv_reg_g
};

function PopulateTargetsList() {
    const value = document.getElementById("populateDropdown").value;

    if (targetOpponentsLists[value]) {
        $('#calcFarmTargetOpponents').val(targetOpponentsLists[value]);
    }
}
