function runSim(){
  beginImmediateCalculation();
  saveCurrentPatternFromForm();
  updateDisplayDefensePower();

  const MAX_GROUP_REPEATS = 1000;
  const opts = {defMul:Number($("defMul").value || 1), stopOnWin:true};
  let defTroops = getDefense();
  const initialTotal = totalTroops(defTroops);
  lastInitialTotal = initialTotal;

  const activeSchedule = getActiveScheduleEntries();
  const activeSlots = activeSchedule.filter(slot => getPatternAttackers(slot.id).length > 0);
  updateActiveSetCountDisplay(activeSchedule.length, activeSlots.length);

  if(!activeSlots.length || initialTotal <= 0){
    $("resultSummary").innerHTML = '<span class="ng">攻撃側または防御側の入力が不足しています。</span>';
    $("dailyTable").innerHTML = "";
    $("detailTable").innerHTML = "";
    lastDetailRows = [];
    finishCalculation();
    return;
  }

  const details = [];
  const daily = [];
  let attackNo = 0;
  let cleared = false;
  let clearAt = null;
  let stoppedReason = "";

  for(let groupNo=1; groupNo<=MAX_GROUP_REPEATS; groupNo++){
    const start = totalTroops(defTroops);
    let loss = 0;
    let count = 0;
    let attackTroopsUsed = 0;
    let attackTroopsLost = 0;
    let attackTroopsUnknown = 0;

    for(const slot of activeSchedule){
      const setNo = slot.setNo;
      const patternId = slot.id;
      const attackers = getPatternAttackers(patternId);
      if(!attackers.length) continue;

      for(let i=0; i<attackers.length; i++){
        if(totalTroops(defTroops) <= 0){
          cleared = true;
          break;
        }
        attackNo += 1;
        count += 1;

        const result = simulateOneBattle(defTroops, attackers[i], groupNo, setNo, i+1, attackNo, opts);
        details.push(result);
        loss += result.totalDefLoss;
        if(result.attackTroopsKnown){
          attackTroopsUsed += Number(result.attackTroops || 0);
          attackTroopsLost += Number(result.attackLoss || 0);
        }else{
          attackTroopsUnknown += 1;
        }
        defTroops = result.after;

        if(totalTroops(defTroops) <= 0){
          cleared = true;
          clearAt = result;
          break;
        }
      }
      if(cleared) break;
    }

    const scheduledPatternIds = activeSchedule.map(slot => slot.id);
    const end = totalTroops(defTroops);

    daily.push({
      day:groupNo,
      schedule: scheduledPatternIds,
      patternSummary: summarizeSchedule(scheduledPatternIds),
      attacks:count,
      attackTroopsUsed,
      attackTroopsLost,
      attackTroopsUnknown,
      start,
      loss,
      end,
      damage:initialTotal > 0 ? 1 - end / initialTotal : 1,
      troops:{...defTroops},
      cleared
    });

    if(cleared) break;

    // 丸めの結果などで1グループ実行しても1兵も減らない場合は無限反復を避ける。
    if(end >= start || loss <= 0){
      stoppedReason = "この1グループでは防御兵が減らないため、討伐まで反復できません。攻撃力または攻撃設定を確認してください。";
      break;
    }

    if(groupNo === MAX_GROUP_REPEATS){
      stoppedReason = `計算上限の${MAX_GROUP_REPEATS}グループに達しました。`;
    }
  }

  lastDetailRows = details;
  renderSummary({cleared, clearAt, details, daily, initialTotal, finalTroops:defTroops, stoppedReason});
  renderDaily(daily);
  renderDetails(details, initialTotal, $("showDetails").checked);
  finishCalculation();
}

function formatPatternLabel(id, name){
  if(!id) return "";
  if(id === "SELF") return name || "自分";
  return `${id}:${name || id}`;
}

function summarizeSchedule(slots){
  const counts = {};
  for(const id of slots){
    if(!id) continue;
    const label = attackPatterns[id]?.name || id;
    const key = formatPatternLabel(id, label);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).map(([key,count]) => `${key}×${count}`).join(" / ") || "なし";
}

function renderSummary(res){
  const finalTotal = totalTroops(res.finalTroops);
  const damage = res.initialTotal > 0 ? 1 - finalTotal / res.initialTotal : 1;
  let html = "";

  if(res.cleared && res.clearAt){
    const r = res.clearAt;
    html += `<span class="ok">討伐可能</span>：指定1グループを <b>${r.day}回</b> 実行し、${r.day}グループ目の${r.setNo}セット目 ${escapeHtml(formatPatternLabel(r.patternId, r.patternName))} 第${r.unitNo}部隊、累計${r.attackNo}攻撃目で防御側0。`;
  }else{
    html += `<span class="ng">未討伐</span>：最終残兵 ${fmt(finalTotal)}、累計ダメージ率 ${pct(damage,2)}。`;
    if(res.stoppedReason) html += `<br>${escapeHtml(res.stoppedReason)}`;
  }

  const knownRows = res.details.filter(r => r.attackTroopsKnown);
  const totalAttackTroops = knownRows.reduce((s,r) => s + Number(r.attackTroops || 0), 0);
  const totalAttackLoss = knownRows.reduce((s,r) => s + Number(r.attackLoss || 0), 0);
  const unknownTroopAttacks = res.details.length - knownRows.length;
  const durability = parseNum($("fortDurability")?.value);

  html += `<br>実行グループ数：${fmt(res.daily.length)} 回 / 実行攻撃数：${fmt(res.details.length)} 回 / 共通攻撃UP：+${getGlobalAttackBonusRate()}%`;
  if(knownRows.length) html += `<br>攻撃側累計投入兵数：${fmt(totalAttackTroops)} / 推定損失：${fmt(totalAttackLoss)} / 生還：${fmt(Math.max(0,totalAttackTroops-totalAttackLoss))}`;
  if(unknownTroopAttacks > 0) html += `<br>※攻撃力を直接入力した ${fmt(unknownTroopAttacks)} 攻撃は兵数不明のため、攻撃側損失兵数を算出していません。`;
  if(durability > 0) html += `<br>砦耐久（保存・表示用）：${fmt(durability)}`;
  html += `<br>最終残兵：${Object.entries(res.finalTroops).map(([k,v]) => `${k} ${fmt(v)}`).join(" / ") || "0"}`;
  $("resultSummary").innerHTML = html;
}

function getUsedDefenseTypesFromRows(rows){
  const used = new Set();
  for(const r of rows){
    for(const k of DEF_TYPES){
      if((r.before?.[k] || 0) > 0 || (r.losses?.[k] || 0) > 0 || (r.after?.[k] || 0) > 0){
        used.add(k);
      }
    }
  }
  if(!used.size){
    const defense = getDefense();
    for(const k of Object.keys(defense)){
      if(defense[k] > 0) used.add(k);
    }
  }
  return DEF_TYPES.filter(k => used.has(k));
}

function renderDaily(rows){
  const used = getUsedDefenseTypesFromRows(lastDetailRows);
  let html = `<thead><tr><th>グループ</th><th>セット割当</th><th>攻撃数</th><th>投入兵数</th><th>攻撃側損失</th><th>開始兵数</th><th>防御損耗</th><th>終了兵数</th><th>累計ダメージ</th>${used.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>`;

  for(const r of rows){
    html += `<tr><td>${r.day}グループ目</td><td class="left">${escapeHtml(r.patternSummary || "")}</td><td>${r.attacks}</td><td>${fmt(r.attackTroopsUsed || 0)}${r.attackTroopsUnknown ? "＋不明" : ""}</td><td>${fmt(r.attackTroopsLost || 0)}${r.attackTroopsUnknown ? "＋不明" : ""}</td><td>${fmt(r.start)}</td><td>${fmt(r.loss)}</td><td>${fmt(r.end)}</td><td>${pct(r.damage,2)}</td>${used.map(k => `<td>${fmt(r.troops[k] || 0)}</td>`).join("")}</tr>`;
  }

  $("dailyTable").innerHTML = html + "</tbody>";
}

function renderDetails(rows,initialTotal,show){
  if(!show){
    $("detailTable").innerHTML = '<tbody><tr><td class="left">詳細表示はオフです。</td></tr></tbody>';
    return;
  }

  const used = getUsedDefenseTypesFromRows(rows);
  let html = `<thead><tr><th>No</th><th>グループ</th><th>セット順</th><th>セット名</th><th>部隊</th><th>兵種</th><th>攻撃兵数</th><th>参照防御</th><th>攻撃UP</th><th>攻撃力A</th><th>総防御D<br><span style="font-size:10px">残兵×兵種</span></th><th>A/D</th><th>攻撃損耗率</th><th>攻撃損失</th><th>攻撃残兵</th><th>防御損耗率</th><th>防御総損耗</th>${used.map(k => `<th>${k}損耗</th>`).join("")}<th>残兵合計</th><th>累計ダメージ</th><th>累計投入</th><th>累計攻撃損失</th></tr></thead><tbody>`;

  let cumAttackTroops = 0;
  let cumAttackLoss = 0;
  for(const r of rows){
    const damage = initialTotal > 0 ? 1 - r.remainingTotal / initialTotal : 1;
    if(r.attackTroopsKnown){
      cumAttackTroops += Number(r.attackTroops || 0);
      cumAttackLoss += Number(r.attackLoss || 0);
    }
    const atkTroopsText = r.attackTroopsKnown ? fmt(r.attackTroops) : "—";
    const atkLossText = r.attackTroopsKnown ? fmt(r.attackLoss) : "—";
    const atkRemainText = r.attackTroopsKnown ? fmt(r.attackRemain) : "—";
    html += `<tr><td>${r.attackNo}</td><td>${r.day}</td><td>${r.setNo}</td><td class="left">${escapeHtml(formatPatternLabel(r.patternId, r.patternName))}</td><td class="left">${escapeHtml(r.unitName)}</td><td>${r.atkType}</td><td>${atkTroopsText}</td><td>${DEF_FAMILY_LABEL[r.defFamily] || r.defFamily || ""}</td><td>+${r.attackUpRate}%</td><td>${fmt(r.A)}</td><td>${fmt(r.D)}</td><td>${Number.isFinite(r.x) ? r.x.toFixed(5) : "∞"}</td><td>${pct(r.atkLossRate,4)}</td><td>${atkLossText}</td><td>${atkRemainText}</td><td>${pct(r.rawDefRate,4)}</td><td>${fmt(r.totalDefLoss)}</td>${used.map(k => `<td>${fmt(r.losses[k] || 0)}</td>`).join("")}<td>${fmt(r.remainingTotal)}</td><td>${pct(damage,2)}</td><td>${fmt(cumAttackTroops)}</td><td>${fmt(cumAttackLoss)}</td></tr>`;
  }

  $("detailTable").innerHTML = html + "</tbody>";
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, ch => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[ch]));
}

function refreshLightweight(){
  updateGlobalAttackUpDisplay();
  saveCurrentPatternFromForm();
  updateDefMulFromPercent();
  updateAttackCardDisplays();
  updateInputStates();
  updateDisplayDefensePower();
}

function refreshAllDebounced(){
  refreshLightweight();
  scheduleAutoRecalc();
}

function refreshAll(){
  refreshLightweight();
  runSim();
}

window.runSim = runSim;
document.addEventListener("DOMContentLoaded", init);
