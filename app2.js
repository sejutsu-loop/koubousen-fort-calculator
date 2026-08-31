function loadScheduleToForm(){
  document.querySelectorAll(".schedulePattern").forEach(select => {
    const idx = Number(select.dataset.setNo) - 1;
    select.value = dailySchedule[idx] || "";
  });
}

function setSchedulePreset(values){
  dailySchedule = values.slice(0,10);
  while(dailySchedule.length < 10) dailySchedule.push("");
  loadScheduleToForm();
  runSim();
}

function getActiveScheduleEntries(){
  return dailySchedule.slice(0,10)
    .map((id,i) => ({id, setNo:i+1}))
    .filter(slot => !!slot.id);
}

function updateActiveSetCountDisplay(activeCount, validCount){
  const el = $("activeSetCount");
  if(!el) return;
  if(activeCount === validCount){
    el.textContent = `${activeCount}セット`;
  }else{
    el.textContent = `${activeCount}セット（有効${validCount}）`;
  }
  el.title = "1グループの攻撃スケジュールでは、「なし」以外を選んだ1〜10セット目だけを自動計算します。";
}

function getPatternAttackers(patternId){
  const pattern = attackPatterns[patternId];
  if(!pattern) return [];
  return pattern.units.map((unit,i) => {
    const type = unit.type || "戦斧兵";
    const troops = Math.max(0, Math.round(Number(unit.troops || 0)));
    return {
      use: !!unit.use,
      patternId,
      patternName: pattern.name || patternId,
      name: `第${i+1}部隊`,
      type,
      family: FAMILY_OF[type],
      troops,
      troopsKnown: troops > 0,
      multiplier: unit.multiplier ?? null,
      power: Number(unit.power || 0)
    };
  }).filter(a => a.use && a.power > 0 && a.family);
}

function setupAttackBulkControls(){
  const select = $("bulkAtkType");
  if(!select) return;
  select.innerHTML = "";
  for(const type of ATTACK_TYPES){
    const option = document.createElement("option");
    option.value = type;
    option.textContent = ATTACK_LABEL?.[type] || type;
    if(type === "戦斧兵") option.selected = true;
    select.appendChild(option);
  }

  $("bulkAtkTypeApply").addEventListener("click", () => {
    const type = select.value || "戦斧兵";
    document.querySelectorAll(".deck-card-area").forEach(card => {
      card.querySelector(".atkType").value = type;
      syncAttackCardPower(card);
    });
    refreshAll();
  });

  $("bulkAtkTroopsApply").addEventListener("click", () => {
    const troops = Math.max(0, Math.round(parseNum($("bulkAtkTroops").value)));
    $("bulkAtkTroops").value = troops.toLocaleString();
    document.querySelectorAll(".deck-card-area").forEach(card => {
      card.querySelector(".atkTroops").value = troops > 0 ? troops.toLocaleString() : "";
      card.querySelector(".atkPower").value = "";
      syncAttackCardPower(card);
    });
    refreshAll();
  });

  $("bulkAtkOn").addEventListener("click", () => {
    document.querySelectorAll(".deck-card-area .atkUse").forEach(box => box.checked = true);
    refreshAll();
  });

  $("bulkAtkOff").addEventListener("click", () => {
    document.querySelectorAll(".deck-card-area .atkUse").forEach(box => box.checked = false);
    refreshAll();
  });
}

function init(){
  loadHeavenlyStats();
  syncHeavenlyDefenseMatrix();
  loadVirtualForts();
  initPatterns();
  buildAttackCards();
  setupAttackBulkControls();
  buildDefenseInputs();
  buildHeavenlyStatsEditor();
  buildVirtualFortSlots();
  buildPatternTabs();
  buildScheduleGrid();
  loadPatternToForm(currentPatternId);
  document.querySelectorAll("[data-fort-preset]").forEach(button => {
    button.addEventListener("click", () => applyFortPreset(button.dataset.fortPreset));
  });
  $("resetHeavenlyStatsBtn").addEventListener("click", resetHeavenlyStats);
  $("fortDurability").addEventListener("input", () => {
    const v = parseNum($("fortDurability").value);
    if(v >= 0) $("fortDurability").classList.add("enabled-input");
    refreshAllDebounced();
  });

  $("defPercent").addEventListener("input", () => {
    if(!presetLocked){
      $("defPercent").classList.remove("preset-filled","locked-input");
      $("defPercent").classList.add("required-input","enabled-input");
      refreshAllDebounced();
    }
  });

  if($("days")) $("days").addEventListener("input", runSim);
  $("stopOnWin").addEventListener("change", runSim);
  $("showDetails").addEventListener("change", runSim);
  ["globalAtk10","globalAtk20"].forEach(id => $(id)?.addEventListener("change", () => { updateGlobalAttackUpDisplay(); runSim(); }));
  updateGlobalAttackUpDisplay();

  refreshAll();
}

function buildAttackCards(){
  const area = $("attackCards");
  area.innerHTML = "";
  for(let i=0; i<5; i++){
    const card = document.createElement("div");
    card.className = "deck-card-area" + (i===0 ? " active" : "");
    card.dataset.unit = i + 1;
    card.innerHTML = `
      <div class="deck-header">第${i+1}部隊</div>
      <div class="card-unit">
        <span class="busyo-icon"></span><span class="unit-icon atkUnitIcon">斧</span>
        <div class="attack-inputs">
          <label>使用 <span><input class="atkUse" type="checkbox"></span></label>
          <label>兵種 <span class="atkTypeHolder"></span></label>
          <label>兵数 <input class="atkTroops required-input" type="text" value="100,000" inputmode="numeric"></label>
          <label>攻撃倍率(%) <input class="atkMultiplier required-input" type="text" value="" inputmode="decimal" placeholder="例 100000"></label>
          <label>攻撃力 <input class="atkPower required-input" type="text" value="" inputmode="numeric" placeholder="直接入力も可"></label>
        </div>
        <div class="attack-mode-note attackModeNote">兵数＋倍率 または 攻撃力を入力</div>
        <div class="power-info"><div class="main atkPowerView">0</div><div class="sub">部隊攻撃力（攻撃UP適用前）</div></div>
      </div>`;
    const typeSelect = makeSelect(ATTACK_TYPES, "戦斧兵");
    typeSelect.className = "atkType required-input";
    card.querySelector(".atkTypeHolder").appendChild(typeSelect);

    card.querySelector(".atkUse").addEventListener("change", refreshAll);
    card.querySelector(".atkTroops").addEventListener("input", () => handleAutoAttackInput(card));
    card.querySelector(".atkMultiplier").addEventListener("input", () => handleAutoAttackInput(card));
    card.querySelector(".atkPower").addEventListener("input", () => handleManualAttackPowerInput(card));
    typeSelect.addEventListener("change", () => { syncAttackCardPower(card); refreshAll(); });
    area.appendChild(card);
  }
}

function buildDefenseInputs(){
  const body = $("defRows");
  body.innerHTML = "";
  for(const name of DEF_TYPES){
    const row = document.createElement("tr");
    row.dataset.defRow = name;
    const options = DEF_TYPES.map(t => `<option value="${t}" ${t===name ? "selected" : ""}>${SHORT[t] || t}</option>`).join("");
    row.innerHTML = `
      <td><input class="defUse" type="checkbox"></td>
      <td><select class="defType optional-input">${options}</select></td>
      <td><input class="defTroops required-input" type="text" value="0" inputmode="numeric"></td>`;
    row.querySelector(".defUse").addEventListener("change", refreshAll);
    row.querySelector(".defType").addEventListener("change", () => {
      if(!presetLocked) refreshAll();
    });
    row.querySelector(".defTroops").addEventListener("input", () => {
      if(!presetLocked){
        const input = row.querySelector(".defTroops");
        input.classList.remove("preset-filled","locked-input");
        input.classList.add("required-input");
        refreshAllDebounced();
      }
    });
    body.appendChild(row);
  }
}


function updateDefMulFromPercent(){
  $("defMul").value = (1 + Number($("defPercent").value || 0) / 100).toString();
}

function updateAttackCardDisplays(){
  document.querySelectorAll(".deck-card-area").forEach(card => {
    const type = card.querySelector(".atkType").value;
    syncAttackCardPower(card);
    card.querySelector(".atkUnitIcon").textContent = SHORT[type] || type;
    card.querySelector(".atkPowerView").textContent = fmt(parseNum(card.querySelector(".atkPower").value));
  });
}

function updateInputStates(){
  document.querySelectorAll(".deck-card-area").forEach(card => {
    const active = card.querySelector(".atkUse").checked;
    card.querySelector(".atkPower").classList.toggle("enabled-input", active);
    card.querySelector(".atkTroops").classList.toggle("enabled-input", active);
    card.querySelector(".atkMultiplier").classList.toggle("enabled-input", active);
    card.querySelector(".atkType").classList.toggle("enabled-input", active);
  });

  document.querySelectorAll("#defRows tr").forEach(row => {
    const active = row.querySelector(".defUse").checked;
    const type = row.querySelector(".defType");
    const troops = row.querySelector(".defTroops");

    if(presetLocked){
      type.classList.remove("enabled-input","required-input","optional-input");
      troops.classList.remove("enabled-input","required-input");
      type.classList.add("preset-filled","locked-input");
      troops.classList.add("preset-filled","locked-input");
      return;
    }

    type.classList.remove("locked-input");
    troops.classList.remove("locked-input");
    type.classList.toggle("enabled-input", active);
    troops.classList.toggle("enabled-input", active);
    if(!active && !troops.classList.contains("preset-filled")){
      troops.classList.remove("enabled-input");
    }
  });
}

function applyPresetLock(lock = presetLocked){
  presetLocked = !!lock;
  ["weatherSelect","defPercent"].forEach(id => {
    const el = $(id);
    el.disabled = presetLocked;
    el.classList.toggle("locked-input", presetLocked);
    if(presetLocked){
      el.classList.remove("required-input","enabled-input");
      el.classList.add("preset-filled");
    }
  });

  document.querySelectorAll("#defRows tr").forEach(row => {
    ["defUse","defType","defTroops"].forEach(cls => {
      const el = row.querySelector("." + cls);
      el.disabled = presetLocked;
      el.classList.toggle("locked-input", presetLocked);
    });
  });
}



function cloneData(v){
  return JSON.parse(JSON.stringify(v));
}

function loadHeavenlyStats(){
  heavenlyStats = cloneData(HEAVENLY_OFFICIAL_STATS);
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.heavenly) || "null");
    if(saved && typeof saved === "object"){
      for(const type of HEAVENLY_TYPES){
        if(!saved[type]) continue;
        const merged = {...heavenlyStats[type]};
        merged.attack = Number(saved[type].attack ?? merged.attack);
        for(const key of DEF_KEYS) merged[key] = Number(saved[type][key] ?? merged[key]);
        heavenlyStats[type] = merged;
      }
    }
  }catch(e){
    console.warn("天兵ステータス読込失敗", e);
  }
}

function saveHeavenlyStats(){
  try{
    localStorage.setItem(STORAGE_KEYS.heavenly, JSON.stringify(heavenlyStats));
  }catch(e){
    console.warn("天兵ステータス保存失敗", e);
  }
}

function syncHeavenlyDefenseMatrix(){
  for(const type of HEAVENLY_TYPES){
    if(!DEF_MATRIX[type]) DEF_MATRIX[type] = {};
    for(const key of DEF_KEYS){
      DEF_MATRIX[type][key] = Math.max(0, Number(heavenlyStats[type]?.[key] || 0));
    }
  }
}

function buildHeavenlyStatsEditor(){
  const body = $("heavenlyStatsBody");
  if(!body) return;
  body.innerHTML = "";
  const fields = ["attack", ...DEF_KEYS];
  for(const type of HEAVENLY_TYPES){
    const row = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.className = "unit-name";
    nameTd.textContent = type;
    row.appendChild(nameTd);
    for(const field of fields){
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "1";
      input.value = String(Number(heavenlyStats[type]?.[field] || 0));
      input.dataset.heavenlyType = type;
      input.dataset.heavenlyField = field;
      input.addEventListener("input", () => {
        const v = Math.max(0, Number(input.value || 0));
        heavenlyStats[type][field] = v;
        syncHeavenlyDefenseMatrix();
        saveHeavenlyStats();
        refreshAllDebounced();
      });
      td.appendChild(input);
      row.appendChild(td);
    }
    body.appendChild(row);
  }
}
