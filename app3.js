function resetHeavenlyStats(){
  if(!confirm("天兵ステータスを2026/8公式値に戻しますか？")) return;
  heavenlyStats = cloneData(HEAVENLY_OFFICIAL_STATS);
  syncHeavenlyDefenseMatrix();
  saveHeavenlyStats();
  buildHeavenlyStatsEditor();
  refreshAll();
}

function loadVirtualForts(){
  virtualForts = Array.from({length:5}, (_,i) => ({name:`仮想砦${i+1}`, state:null}));
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.forts) || "null");
    if(Array.isArray(saved)){
      for(let i=0;i<Math.min(5,saved.length);i++){
        if(!saved[i]) continue;
        virtualForts[i] = {
          name:String(saved[i].name || `仮想砦${i+1}`),
          state:saved[i].state || null
        };
      }
    }
  }catch(e){
    console.warn("仮想砦読込失敗", e);
  }
}

function saveVirtualForts(){
  try{
    localStorage.setItem(STORAGE_KEYS.forts, JSON.stringify(virtualForts));
  }catch(e){
    console.warn("仮想砦保存失敗", e);
  }
}

function buildVirtualFortSlots(){
  const area = $("virtualFortSlots");
  if(!area) return;
  area.innerHTML = "";
  for(let i=0;i<5;i++){
    const slot = document.createElement("div");
    slot.className = "virtual-fort-slot";
    slot.dataset.slot = i;
    slot.innerHTML = `
      <b>スロット${i+1}</b>
      <input class="virtualFortName" type="text" value="${escapeHtml(virtualForts[i]?.name || `仮想砦${i+1}`)}">
      <div class="virtual-fort-actions">
        <button type="button" class="virtualFortSave">保存</button>
        <button type="button" class="virtualFortLoad">読込</button>
        <button type="button" class="virtualFortDelete">削除</button>
      </div>`;
    slot.querySelector(".virtualFortSave").addEventListener("click", () => saveVirtualFortSlot(i, slot));
    slot.querySelector(".virtualFortLoad").addEventListener("click", () => loadVirtualFortSlot(i, slot));
    slot.querySelector(".virtualFortDelete").addEventListener("click", () => deleteVirtualFortSlot(i, slot));
    area.appendChild(slot);
  }
}

function getCurrentFortState(){
  return {
    durability: parseNum($("fortDurability")?.value),
    weather: $("weatherSelect")?.value || "晴れ",
    defPercent: Number($("defPercent")?.value || 0),
    troops: getDefense(),
    heavenlyStats: cloneData(heavenlyStats)
  };
}

function saveVirtualFortSlot(i, slotEl){
  const name = String(slotEl.querySelector(".virtualFortName").value || `仮想砦${i+1}`).trim() || `仮想砦${i+1}`;
  virtualForts[i] = {name, state:getCurrentFortState()};
  saveVirtualForts();
  slotEl.querySelector(".virtualFortName").value = name;
  alert(`${name} を保存しました。`);
}

function loadVirtualFortSlot(i, slotEl){
  const item = virtualForts[i];
  if(!item?.state){
    alert("このスロットには保存データがありません。");
    return;
  }
  applyFortState(item.state, item.name || `仮想砦${i+1}`);
  if(slotEl) slotEl.querySelector(".virtualFortName").value = item.name || `仮想砦${i+1}`;
}

function deleteVirtualFortSlot(i, slotEl){
  if(!virtualForts[i]?.state){
    virtualForts[i] = {name:`仮想砦${i+1}`, state:null};
    if(slotEl) slotEl.querySelector(".virtualFortName").value = virtualForts[i].name;
    saveVirtualForts();
    return;
  }
  if(!confirm(`スロット${i+1}の保存データを削除しますか？`)) return;
  virtualForts[i] = {name:`仮想砦${i+1}`, state:null};
  saveVirtualForts();
  if(slotEl) slotEl.querySelector(".virtualFortName").value = virtualForts[i].name;
}

function applyFortPreset(key){
  const preset = FORT_PRESETS[key];
  if(!preset) return;
  applyFortState({
    durability:preset.durability,
    weather:"晴れ",
    defPercent:0,
    troops:preset.troops
  }, preset.label);
}

function applyFortState(state, label){
  presetLocked = false;
  applyPresetLock(false);

  if(state.heavenlyStats && typeof state.heavenlyStats === "object"){
    const restored = cloneData(HEAVENLY_OFFICIAL_STATS);
    for(const type of HEAVENLY_TYPES){
      if(!state.heavenlyStats[type]) continue;
      restored[type] = {...restored[type], ...state.heavenlyStats[type]};
    }
    heavenlyStats = restored;
    syncHeavenlyDefenseMatrix();
    saveHeavenlyStats();
    buildHeavenlyStatsEditor();
  }

  if($("fortDurability")) setVal($("fortDurability"), Number(state.durability || 0));
  if($("weatherSelect")) $("weatherSelect").value = state.weather || "晴れ";
  if($("defPercent")){
    $("defPercent").value = String(Number(state.defPercent || 0));
    $("defPercent").disabled = false;
    $("defPercent").classList.remove("preset-filled","locked-input");
    $("defPercent").classList.add("required-input","enabled-input");
  }

  applyDefenseManualValues(state.troops || {});
  $("currentStageName").innerHTML = `${escapeHtml(label || "仮想砦")}<span class="mode-sub">攻防戦・手入力修正可</span>`;
  $("currentStageName").classList.remove("locked","unlocked");
  $("currentStageName").classList.add("manual");
  refreshAll();
}

function applyDefenseManualValues(values){
  document.querySelectorAll("#defRows tr").forEach(row => {
    const base = row.dataset.defRow;
    const check = row.querySelector(".defUse");
    const type = row.querySelector(".defType");
    const troops = row.querySelector(".defTroops");
    check.disabled = false;
    type.disabled = false;
    troops.disabled = false;
    type.value = base;
    const n = Number(values[base] || 0);
    check.checked = n > 0;
    setVal(troops, n);
    type.classList.remove("preset-filled","locked-input");
    troops.classList.remove("preset-filled","locked-input");
    type.classList.add("optional-input");
    troops.classList.add("required-input");
  });
}

function getDefense(){
  const out = {};
  document.querySelectorAll("#defRows tr").forEach(row => {
    if(!row.querySelector(".defUse").checked) return;
    const name = row.querySelector(".defType").value;
    const n = parseNum(row.querySelector(".defTroops").value);
    if(n > 0) out[name] = (out[name] || 0) + n;
  });
  return out;
}

function getAttackers(){
  saveCurrentPatternFromForm();
  return getPatternAttackers(currentPatternId);
}

function getGlobalAttackBonusRate(){
  let rate = 0;
  if($("globalAtk10")?.checked) rate += 10;
  if($("globalAtk20")?.checked) rate += 20;
  return rate;
}

function updateGlobalAttackUpDisplay(){
  const r10 = !!$("globalAtk10")?.checked;
  const r20 = !!$("globalAtk20")?.checked;
  if($("globalAtk10State")) $("globalAtk10State").textContent = r10 ? "ON" : "OFF";
  if($("globalAtk20State")) $("globalAtk20State").textContent = r20 ? "ON" : "OFF";
  if($("globalAttackBonus")) $("globalAttackBonus").textContent = `+${(r10?10:0)+(r20?20:0)}%`;
}

function calcEffectiveDefense(defTroops, attackFamily, defMul){
  let total = 0;
  for(const [name,n] of Object.entries(defTroops)){
    total += n * (DEF_MATRIX[name]?.[attackFamily] || 0);
  }
  return total * defMul;
}

function calcDisplayDefense(defTroops, defMul){
  const attacker = getAttackers()[0];
  let family = attacker?.family;
  if(!family){
    const firstType = document.querySelector(".deck-card-area .atkType")?.value || "戦斧兵";
    family = FAMILY_OF[firstType] || "斧兵";
  }
  return calcEffectiveDefense(defTroops, family, defMul);
}

function updateDisplayDefensePower(){
  updateDefMulFromPercent();
  const defTroops = getDefense();
  const defMul = Number($("defMul").value || 1);
  $("displayDefensePower").textContent = fmt(calcDisplayDefense(defTroops, defMul));
}

function calcBattleRates(A,D){
  if(D <= 0) return {rawDefRate:1, defRate:1, atkLossRate:0};
  if(A <= 0) return {rawDefRate:0, defRate:0, atkLossRate:1};
  const ratio = A / D;
  const power = Math.pow(Math.max(0, ratio), 1.5);
  if(ratio >= 1){
    return {rawDefRate:1, defRate:1, atkLossRate:Math.min(1, 1 / Math.max(1e-12, power))};
  }
  return {rawDefRate:power, defRate:power, atkLossRate:1};
}

function calcLossWeightForTarget(defTroops,targetName){
  const family = FAMILY_OF[targetName];
  let weight = 0;
  for(const [defName,n] of Object.entries(defTroops)){
    weight += n * (DEF_MATRIX[defName]?.[family] || 0);
  }
  return weight;
}

function allocateLosses(defTroops,totalLoss){
  const losses = {};
  for(const k of Object.keys(defTroops)) losses[k] = 0;

  let remain = Math.min(totalTroops(defTroops), Math.max(0, Math.round(totalLoss)));
  let candidates = Object.keys(defTroops).filter(k => defTroops[k] > 0);

  for(let i=0; i<20 && remain>0 && candidates.length; i++){
    const weights = {};
    let sumWeight = 0;

    for(const name of candidates){
      const cap = defTroops[name] - losses[name];
      if(cap <= 0) continue;
      const weight = Math.max(0, calcLossWeightForTarget(defTroops, name));
      if(weight > 0){
        weights[name] = weight;
        sumWeight += weight;
      }
    }

    candidates = candidates.filter(name => (defTroops[name] - losses[name]) > 0 && weights[name] > 0);
    if(!candidates.length || sumWeight <= 0) break;

    const allocs = candidates.map(name => {
      const cap = defTroops[name] - losses[name];
      const raw = remain * weights[name] / sumWeight;
      const floor = Math.min(cap, Math.floor(raw));
      return {name, raw, floor, frac:raw - Math.floor(raw)};
    });

    let used = 0;
    for(const a of allocs){
      if(a.floor > 0){
        losses[a.name] += a.floor;
        used += a.floor;
      }
    }

    let rest = remain - used;
    allocs.sort((a,b) => b.frac - a.frac);
    for(const a of allocs){
      if(rest <= 0) break;
      const capLeft = defTroops[a.name] - losses[a.name];
      if(capLeft > 0){
        losses[a.name] += 1;
        rest -= 1;
      }
    }

    const newRemain = remain - (used + (remain - used - rest));
    if(newRemain === remain) break;
    remain = newRemain;
    candidates = candidates.filter(name => (defTroops[name] - losses[name]) > 0);
  }
  return losses;
}

function simulateOneBattle(defTroops,attacker,day,setNo,unitNo,attackNo,opts){
  const attackUpRate = getGlobalAttackBonusRate();
  const A = attacker.power * (1 + attackUpRate / 100);
  const D = calcEffectiveDefense(defTroops, attacker.family, opts.defMul);
  const ratio = D > 0 ? A / D : Infinity;
  const rates = calcBattleRates(A,D);
  const totalDefLoss = rates.defRate >= 1
    ? totalTroops(defTroops)
    : Math.min(totalTroops(defTroops), Math.round(totalTroops(defTroops) * rates.defRate));
  const losses = allocateLosses(defTroops,totalDefLoss);
  const attackTroopsKnown = !!attacker.troopsKnown && Number(attacker.troops) > 0;
  const attackTroops = attackTroopsKnown ? Math.max(0, Math.round(Number(attacker.troops))) : null;
  const attackLoss = attackTroopsKnown ? Math.min(attackTroops, Math.max(0, Math.round(attackTroops * rates.atkLossRate))) : null;
  const attackRemain = attackTroopsKnown ? Math.max(0, attackTroops - attackLoss) : null;
  const next = {};

  for(const [name,n] of Object.entries(defTroops)){
    next[name] = Math.max(0, n - (losses[name] || 0));
  }

  return {
    attackNo, day, setNo, unitNo,
    patternId:attacker.patternId || "",
    patternName:attacker.patternName || "",
    unitName:attacker.name,
    atkType:attacker.type,
    defFamily:attacker.family,
    attackUpRate, A, D, x:ratio,
    rawDefRate:rates.rawDefRate,
    defRate:rates.defRate,
    atkLossRate:rates.atkLossRate,
    attackTroopsKnown,
    attackTroops,
    attackLoss,
    attackRemain,
    totalDefLoss,
    losses,
    before:{...defTroops},
    after:next,
    remainingTotal:totalTroops(next)
  };
}
