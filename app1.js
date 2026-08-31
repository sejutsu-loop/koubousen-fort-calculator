/*
  攻防戦砦計算機（仮） v0.4.6
  Copyright © bra3-sejutsu-loop.
  無断転載・改変再配布禁止。
  個人利用の範囲で使用可。
*/
"use strict";

const DEF_KEYS = ["歩兵","槍兵","弓兵","騎兵","斧兵","双兵","錘兵"];
const DEF_FAMILY_LABEL = {"歩兵":"剣防御","槍兵":"槍防御","弓兵":"弓防御","騎兵":"騎防御","斧兵":"斧防御","双兵":"双防御","錘兵":"錘防御"};
const HEAVENLY_TYPES = ["重装槍兵","重装弓兵","重装騎兵","禁軍兵"];
const ATTACK_TYPES = ["重装槍兵","重装弓兵","重装騎兵","禁軍兵","戦斧兵","双剣兵","大錘兵","大剣兵","矛兵","弩兵","近衛騎兵"];
const ATTACK_LABEL = {
  "重装槍兵":"重装槍兵",
  "重装弓兵":"重装弓兵",
  "重装騎兵":"重装騎兵",
  "禁軍兵":"禁軍兵",
  "戦斧兵":"戦斧兵",
  "双剣兵":"双剣兵",
  "大錘兵":"大錘兵",
  "大剣兵":"大剣兵",
  "矛兵":"矛槍兵",
  "弩兵":"弩兵",
  "近衛騎兵":"近衛騎兵"
};
const FAMILY_OF = {
  "剣兵":"歩兵","大剣兵":"歩兵","盾兵":"歩兵","重盾兵":"歩兵","禁軍兵":"歩兵",
  "槍兵":"槍兵","矛兵":"槍兵","重装槍兵":"槍兵",
  "弓兵":"弓兵","弩兵":"弓兵","重装弓兵":"弓兵",
  "騎兵":"騎兵","近衛騎兵":"騎兵","重装騎兵":"騎兵","斥候騎兵":"騎兵",
  "戦斧兵":"斧兵","双剣兵":"双兵","大錘兵":"錘兵"
};
const SHORT = {
  "重装槍兵":"重槍","重装弓兵":"重弓","重装騎兵":"重騎","禁軍兵":"禁",
  "重盾兵":"盾","矛兵":"矛","弩兵":"弩","近衛騎兵":"騎","斥候騎兵":"斥騎","戦斧兵":"斧","双剣兵":"双","大錘兵":"錘",
  "剣兵":"剣","大剣兵":"大剣","盾兵":"盾","槍兵":"槍","弓兵":"弓"
};
const HEAVENLY_OFFICIAL_STATS = {
  "重装槍兵": {attack:262, "歩兵":280, "槍兵":200, "弓兵":126, "騎兵":274, "斧兵":184, "双兵":201, "錘兵":136},
  "重装弓兵": {attack:286, "歩兵":290, "槍兵":290, "弓兵":210, "騎兵":130, "斧兵":105, "双兵":136, "錘兵":387},
  "重装騎兵": {attack:253, "歩兵":302, "槍兵":140, "弓兵":300, "騎兵":220, "斧兵":260, "双兵":91,  "錘兵":240},
  "禁軍兵":   {attack:141, "歩兵":66,  "槍兵":312, "弓兵":336, "騎兵":303, "斧兵":85,  "双兵":71,  "錘兵":116}
};
const ATTACK_BASE_STATS = {
  "重装槍兵":262,"重装弓兵":286,"重装騎兵":253,"禁軍兵":141,
  "戦斧兵":142,"双剣兵":105,"大錘兵":185,"大剣兵":85,"矛兵":100,"弩兵":105,"近衛騎兵":110
};
let heavenlyStats = JSON.parse(JSON.stringify(HEAVENLY_OFFICIAL_STATS));
const DEF_MATRIX = {
  "重盾兵":   { "歩兵":60,  "槍兵":270, "弓兵":260, "騎兵":280, "斧兵":48,  "双兵":56,  "錘兵":40  },
  "矛兵":     { "歩兵":140, "槍兵":100, "弓兵":63,  "騎兵":137, "斧兵":51,  "双兵":60,  "錘兵":42  },
  "弩兵":     { "歩兵":145, "槍兵":145, "弓兵":105, "騎兵":65,  "斧兵":54,  "双兵":65,  "錘兵":46  },
  "近衛騎兵": { "歩兵":151, "槍兵":70,  "弓兵":150, "騎兵":110, "斧兵":59,  "双兵":70,  "錘兵":52  },
  "斥候騎兵": { "歩兵":30,  "槍兵":10,  "弓兵":40,  "騎兵":20,  "斧兵":2,   "双兵":2,   "錘兵":2   },
  "戦斧兵":   { "歩兵":139, "槍兵":54,  "弓兵":52,  "騎兵":50,  "斧兵":142, "双兵":155, "錘兵":105 },
  "双剣兵":   { "歩兵":147, "槍兵":105, "弓兵":102, "騎兵":100, "斧兵":81,  "双兵":105, "錘兵":298 },
  "大錘兵":   { "歩兵":150, "槍兵":58,  "弓兵":55,  "騎兵":53,  "斧兵":200, "双兵":70,  "錘兵":185 },
  "重装槍兵": { "歩兵":280, "槍兵":200, "弓兵":126, "騎兵":274, "斧兵":184, "双兵":201, "錘兵":136 },
  "重装弓兵": { "歩兵":290, "槍兵":290, "弓兵":210, "騎兵":130, "斧兵":105, "双兵":136, "錘兵":387 },
  "重装騎兵": { "歩兵":302, "槍兵":140, "弓兵":300, "騎兵":220, "斧兵":260, "双兵":91,  "錘兵":240 },
  "禁軍兵":   { "歩兵":66,  "槍兵":312, "弓兵":336, "騎兵":303, "斧兵":85,  "双兵":71,  "錘兵":116 }
};
const DEF_TYPES = Object.keys(DEF_MATRIX);
const STORAGE_KEYS = {
  heavenly:"bra3_hokubatsu_v03_heavenly",
  forts:"bra3_hokubatsu_v03_virtual_forts"
};
const FORT_PRESETS = {
  9: {
    label:"2026/8公式 ★9",
    durability:20000000,
    troops:{"禁軍兵":400000000,"斥候騎兵":1800000}
  },
  10: {
    label:"2026/8公式 ★10",
    durability:30000000,
    troops:{
      "戦斧兵":130000000,"双剣兵":130000000,"大錘兵":130000000,
      "重装槍兵":250000000,"重装弓兵":250000000,"重装騎兵":250000000,
      "禁軍兵":100000000,"斥候騎兵":4500000
    }
  },
  11: {
    label:"2026/8公式 ★11",
    durability:40000000,
    troops:{"禁軍兵":3500000000,"斥候騎兵":7000000}
  },
  12: {
    label:"2026/8公式 ★12",
    durability:50000000,
    troops:{
      "戦斧兵":500000000,"双剣兵":500000000,"大錘兵":500000000,
      "重装槍兵":1000000000,"重装弓兵":1000000000,"重装騎兵":1000000000,
      "禁軍兵":400000000,"斥候騎兵":10500000
    }
  }
};
let virtualForts = Array.from({length:5}, (_,i) => ({name:`仮想砦${i+1}`, state:null}));
const PATTERN_IDS = ["SELF","A","B","C","D","E","F","G","H","I"];
const DEFAULT_PATTERN_NAMES = {
  SELF:"自分",
  A:"同盟員A",
  B:"同盟員B",
  C:"同盟員C",
  D:"同盟員D",
  E:"同盟員E",
  F:"同盟員F",
  G:"同盟員G",
  H:"同盟員H",
  I:"同盟員I"
};

let lastDetailRows = [];
let lastInitialTotal = 0;
let presetLocked = false;
let attackPatterns = {};
let currentPatternId = "SELF";
let dailySchedule = ["SELF","","","","","","","","",""];
let patternFormLoading = false;

const $ = id => document.getElementById(id);
const fmt = n => Math.round(Number(n)||0).toLocaleString();
const pct = (x,d=2) => (Number(x)*100).toFixed(d)+"%";
const parseNum = s => Number(String(s||"").replace(/[,\s]/g,"")) || 0;
const parseOptionalNum = s => {
  const t = String(s ?? "").replace(/[,\s]/g,"").trim();
  if(t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const setVal = (el,n) => { if(el) el.value = Number(n||0).toLocaleString(); };
const totalTroops = t => Object.values(t).reduce((a,b)=>a+Number(b||0),0);
const clampInt = (v,min,max) => Math.max(min,Math.min(max,Math.floor(Number(v)||0)));

const AUTO_RECALC_DELAY_MS = 1000;
let autoRecalcTimer = null;

function setResultsStale(stale){
  [$("resultSummary"), $("dailyTable"), $("detailTable")].forEach(el => {
    if(el) el.classList.toggle("result-stale", !!stale);
  });
}

function setCalcStatus(state, text){
  const el = $("calcStatus");
  if(!el) return;
  el.classList.remove("waiting","calculating","done");
  el.classList.add(state);
  el.textContent = text;
}

function scheduleAutoRecalc(){
  if(autoRecalcTimer) clearTimeout(autoRecalcTimer);
  setResultsStale(true);
  setCalcStatus("waiting", "⏳ 入力変更あり — 下の結果は変更前です。1秒後に自動再計算します");
  autoRecalcTimer = setTimeout(() => {
    autoRecalcTimer = null;
    runSim();
  }, AUTO_RECALC_DELAY_MS);
}

function beginImmediateCalculation(){
  if(autoRecalcTimer){
    clearTimeout(autoRecalcTimer);
    autoRecalcTimer = null;
  }
  setResultsStale(true);
  setCalcStatus("calculating", "計算中…");
}

function finishCalculation(){
  setResultsStale(false);
  setCalcStatus("done", "✓ 最新の入力内容で計算済み");
}

function makeSelect(options, value){
  const select = document.createElement("select");
  for(const item of options){
    const option = document.createElement("option");
    option.value = String(item);
    option.textContent = ATTACK_LABEL?.[item] || String(item);
    if(String(item) === String(value)) option.selected = true;
    select.appendChild(option);
  }
  return select;
}


function createDefaultPattern(id){
  return {
    id,
    name: DEFAULT_PATTERN_NAMES[id] || id,
    units: Array.from({length:5}, () => ({use:false, type:"戦斧兵", troops:100000, multiplier:null, power:0}))
  };
}

function initPatterns(){
  attackPatterns = {};
  for(const id of PATTERN_IDS) attackPatterns[id] = createDefaultPattern(id);
}

function buildPatternTabs(){
  const area = $("patternTabs");
  if(!area) return;
  area.innerHTML = "";
  for(const id of PATTERN_IDS){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pattern-tab";
    button.dataset.patternId = id;
    button.addEventListener("click", () => switchPattern(id));
    area.appendChild(button);
  }
  $("patternNameInput").addEventListener("input", () => {
    if(!attackPatterns[currentPatternId]) return;
    attackPatterns[currentPatternId].name = $("patternNameInput").value || currentPatternId;
    updatePatternLabels();
    refreshAllDebounced();
  });
  $("patternClearBtn").addEventListener("click", () => {
    if(!confirm("現在のセットをクリアしますか？")) return;
    attackPatterns[currentPatternId] = createDefaultPattern(currentPatternId);
    loadPatternToForm(currentPatternId);
    updatePatternLabels();
    refreshAll();
  });
  updatePatternLabels();
}

function updatePatternLabels(){
  document.querySelectorAll(".pattern-tab").forEach(button => {
    const id = button.dataset.patternId;
    const name = attackPatterns[id]?.name || id;
    button.textContent = id === "SELF" ? name : `${id}: ${name}`;
    button.classList.toggle("active", id === currentPatternId);
  });
  document.querySelectorAll(".schedulePattern").forEach(select => {
    const current = select.value;
    select.innerHTML = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = "なし";
    select.appendChild(none);
    for(const id of PATTERN_IDS){
      const option = document.createElement("option");
      option.value = id;
      const name = attackPatterns[id]?.name || id;
      option.textContent = id === "SELF" ? name : `${id}: ${name}`;
      select.appendChild(option);
    }
    select.value = current;
  });
  if($("patternNameInput") && attackPatterns[currentPatternId]){
    $("patternNameInput").value = attackPatterns[currentPatternId].name || currentPatternId;
  }
}

function getUnitBaseAttack(type){
  if(HEAVENLY_TYPES.includes(type)) return Math.max(0, Number(heavenlyStats?.[type]?.attack ?? ATTACK_BASE_STATS[type] ?? 0));
  return Math.max(0, Number(ATTACK_BASE_STATS[type] || 0));
}

function calcAutoAttackPower(type,troops,multiplier){
  const base = getUnitBaseAttack(type);
  if(!(troops > 0) || multiplier === null || !Number.isFinite(multiplier) || base <= 0) return 0;
  return Math.max(0, Math.round(troops * base * (1 + multiplier / 100)));
}

function syncAttackCardPower(card){
  const troopsEl = card.querySelector(".atkTroops");
  const multEl = card.querySelector(".atkMultiplier");
  const powerEl = card.querySelector(".atkPower");
  const modeEl = card.querySelector(".attackModeNote");
  const troops = parseOptionalNum(troopsEl.value);
  const multiplier = parseOptionalNum(multEl.value);
  if(troops !== null && troops > 0 && multiplier !== null){
    const power = calcAutoAttackPower(card.querySelector(".atkType").value, troops, multiplier);
    powerEl.value = power > 0 ? power.toLocaleString() : "";
    powerEl.classList.add("auto-calculated");
    if(modeEl) modeEl.textContent = `自動計算（基礎攻撃 ${getUnitBaseAttack(card.querySelector(".atkType").value)}）`;
    return {mode:"auto", troops:Math.round(troops), multiplier, power};
  }
  powerEl.classList.remove("auto-calculated");
  if(modeEl) modeEl.textContent = powerEl.value.trim() ? "攻撃力を直接入力" : "兵数＋倍率 または 攻撃力を入力";
  return {mode:"manual", troops:0, multiplier:null, power:parseNum(powerEl.value)};
}

function handleAutoAttackInput(card){
  const powerEl = card.querySelector(".atkPower");
  powerEl.value = "";
  powerEl.classList.remove("auto-calculated");
  syncAttackCardPower(card);
  refreshAllDebounced();
}

function handleManualAttackPowerInput(card){
  const powerEl = card.querySelector(".atkPower");
  if(String(powerEl.value).trim() !== ""){
    card.querySelector(".atkTroops").value = "";
    card.querySelector(".atkMultiplier").value = "";
  }
  syncAttackCardPower(card);
  refreshAllDebounced();
}

function saveCurrentPatternFromForm(){
  if(patternFormLoading || !attackPatterns[currentPatternId]) return;
  const pattern = attackPatterns[currentPatternId];
  pattern.units = Array.from(document.querySelectorAll(".deck-card-area")).map(card => {
    syncAttackCardPower(card);
    const troopsRaw = parseOptionalNum(card.querySelector(".atkTroops").value);
    const multiplierRaw = parseOptionalNum(card.querySelector(".atkMultiplier").value);
    return {
      use: card.querySelector(".atkUse").checked,
      type: card.querySelector(".atkType").value,
      troops: troopsRaw !== null && troopsRaw > 0 ? Math.round(troopsRaw) : 0,
      multiplier: multiplierRaw,
      power: parseNum(card.querySelector(".atkPower").value)
    };
  });
}

function loadPatternToForm(id){
  const pattern = attackPatterns[id];
  if(!pattern) return;
  patternFormLoading = true;
  document.querySelectorAll(".deck-card-area").forEach((card,i) => {
    const unit = pattern.units[i] || {use:false, type:"戦斧兵", troops:100000, multiplier:null, power:0};
    card.querySelector(".atkUse").checked = !!unit.use;
    card.querySelector(".atkType").value = unit.type || "戦斧兵";
    const hasTroops = Number(unit.troops || 0) > 0;
    const hasMultiplier = unit.multiplier !== null && unit.multiplier !== undefined;
    card.querySelector(".atkTroops").value = hasTroops ? Number(unit.troops).toLocaleString() : "";
    card.querySelector(".atkMultiplier").value = hasMultiplier ? String(Number(unit.multiplier)) : "";
    card.querySelector(".atkPower").value = (!hasTroops && !hasMultiplier && unit.power) ? Number(unit.power).toLocaleString() : "";
    syncAttackCardPower(card);
  });
  if($("patternNameInput")) $("patternNameInput").value = pattern.name || id;
  patternFormLoading = false;
  updatePatternLabels();
  updateAttackCardDisplays();
  updateInputStates();
}

function switchPattern(id){
  if(id === currentPatternId) return;
  saveCurrentPatternFromForm();
  currentPatternId = id;
  loadPatternToForm(id);
  refreshAll();
}

function buildScheduleGrid(){
  const grid = $("scheduleGrid");
  if(!grid) return;
  grid.innerHTML = "";
  for(let setNo=1; setNo<=10; setNo++){
    const box = document.createElement("div");
    box.className = "schedule-slot";
    box.innerHTML = `<b>${setNo}セット目</b>`;
    const select = document.createElement("select");
    select.className = "schedulePattern";
    select.dataset.setNo = setNo;
    select.addEventListener("change", () => {
      dailySchedule[setNo-1] = select.value;
      runSim();
    });
    box.appendChild(select);
    grid.appendChild(box);
  }
  updatePatternLabels();
  loadScheduleToForm();
  $("scheduleSelf4Btn").addEventListener("click", () => setSchedulePreset(["SELF","SELF","SELF","SELF","SELF","SELF","SELF","SELF","SELF","SELF"]));
  $("scheduleSelf4A4Btn").addEventListener("click", () => setSchedulePreset(["SELF","SELF","SELF","SELF","SELF","A","A","A","A","A"]));
  $("scheduleSelf4AtoFBtn").addEventListener("click", () => setSchedulePreset(["SELF","SELF","SELF","SELF","A","B","C","D","E","F"]));
  $("scheduleSelf1AtoIBtn").addEventListener("click", () => setSchedulePreset(["SELF","A","B","C","D","E","F","G","H","I"]));
  $("scheduleClearBtn").addEventListener("click", () => setSchedulePreset(["","","","","","","","","",""]));
}
