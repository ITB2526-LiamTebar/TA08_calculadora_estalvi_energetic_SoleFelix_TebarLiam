/* ========================================
   Energy Calculator ITB — app.js
   ASIX 1D · Tebar Liam & Solé Fèlix
   ======================================== */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const JSON_URL = 'https://raw.githubusercontent.com/ITB2526-LiamTebar/TA08_calculadora_d-estalvi_energ-tic/refs/heads/main/dataclean.json';

const FALLBACK_DATA = {"_comment":"The 4 key indicators selected: date, document_type, entity, total_amount","documents":[{"document_type":"material_invoice","date":"2024-04-30","due_date":"2024-05-31","entity":"Lyreco","total_amount":277.13,"vat":48.10,"taxable_base":229.03,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-05-31","due_date":"2024-06-30","entity":"Lyreco","total_amount":261.24,"vat":45.34,"taxable_base":215.90,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-06-30","due_date":"2024-07-31","entity":"Lyreco","total_amount":34.36,"vat":5.96,"taxable_base":28.40,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-10-31","due_date":"2024-11-30","entity":"Lyreco","total_amount":198.56,"vat":34.46,"taxable_base":164.10,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"service_invoice","date":"2024-05-23","entity":"Maintenance","total_amount":2548.02,"vat":442.22,"taxable_base":2105.80,"category":"technical_services"},{"document_type":"service_invoice","date":"2024-07-05","entity":"Maintenance","total_amount":348.48,"vat":60.48,"taxable_base":288.00,"category":"technical_services"},{"document_type":"service_invoice","date":"2024-09-13","entity":"Maintenance","total_amount":1012.98,"vat":175.81,"taxable_base":837.17,"category":"technical_services"},{"document_type":"cleaning_invoice","date":"2024-06-20","entity":"Neteges","total_amount":750.26,"vat":130.21,"taxable_base":620.05,"category":"cleaning"},{"document_type":"cleaning_invoice","date":"2024-05-27","entity":"Neteges","total_amount":454.72,"vat":78.92,"taxable_base":375.80,"category":"cleaning"},{"document_type":"telecom_invoice","date":"2024-03-04","entity":"O2","total_amount":50.00,"vat":8.67,"taxable_base":41.32,"category":"telecommunications"},{"document_type":"telecom_invoice","date":"2024-05","entity":"DIGI","total_amount":30.00,"vat":5.21,"taxable_base":24.79,"category":"telecommunications"},{"document_type":"water_consumption","date":"2024-02-25","entity":"Water","average_consumption_liters":200},{"document_type":"water_consumption","date":"2024-02-28","entity":"Water","average_consumption_liters":400},{"document_type":"water_consumption","date":"2024-02-29","entity":"Water","average_consumption_liters":450},{"document_type":"indicator","date":"2024-11-15","entity":"ASIXc1A","percentage":15.00},{"document_type":"indicator","date":"2025-01-20","entity":"ASIXc1C","percentage":68.75},{"document_type":"energy_report","date":"2025-01","entity":"ITB_Plant","total_production_kwh":72021.35,"total_consumption_kwh":165.55,"self_consumption_percentage":100,"revenue_eur":0.31}]};

const MONTHS      = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
const SCHOOL_MONTHS = [0,1,2,3,4,8,9,10,11];
const MONTH_TYPE  = ['holiday','school','school','holiday','school','school','break','break','school','school','school','holiday'];

const HOLIDAY_FACTORS = {
  electricity:[0.85,1.00,1.00,0.88,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.80],
  water:      [0.85,1.00,1.00,0.90,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.80],
  supplies:   [0.80,1.00,1.00,0.85,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.75],
  cleaning:   [0.85,1.00,1.00,0.88,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.80],
};
const SEASONAL = {
  electricity:[1.15,1.10,1.00,0.90,0.85,0.70,0.50,0.45,0.85,1.00,1.10,1.20],
  water:      [1.00,1.00,1.05,1.00,1.05,0.90,0.20,0.20,1.05,1.10,1.05,1.00],
  supplies:   [1.10,1.10,1.00,1.10,1.05,0.60,0.20,0.20,1.20,1.15,1.10,1.00],
  cleaning:   [1.05,1.00,1.00,1.00,1.00,0.70,0.40,0.40,1.10,1.05,1.00,1.00],
};

// Optimisation measures per category
const MEASURES = {
  electricity: [
    { id:'e1', label:'Virtualització Proxmox',              pct:15, year:1 },
    { id:'e2', label:"Scripts d'auto-apagat nocturn",       pct:10, year:1 },
    { id:'e3', label:'Renovació progressiva LED a 3 anys',  pct: 8, year:1 },
    { id:'e4', label:'Recondicionament servidors antics',   pct: 5, year:2 },
  ],
  water: [
    { id:'w1', label:'Airejadors i difusors en aixetes',    pct:20, year:1 },
    { id:'w2', label:'Reparació de fuites detectades',      pct:10, year:1 },
    { id:'w3', label:"Aprofitament d'aigües pluvials",      pct: 8, year:2 },
    { id:'w4', label:'Pla de substitució de polsadors',     pct: 5, year:2 },
  ],
  supplies: [
    { id:'s1', label:"Digitalització d'exàmens",            pct:40, year:1 },
    { id:'s2', label:"Sistema de quotes d'impressió",       pct:15, year:1 },
    { id:'s3', label:'Compra paper 100% reciclat',          pct:10, year:2 },
    { id:'s4', label:'Devolució de tòners al fabricant',    pct: 5, year:3 },
  ],
  cleaning: [
    { id:'c1', label:"Compra a granel i farciment d'envasos",     pct:30, year:1 },
    { id:'c2', label:'Substitució per productes eco-concentrats', pct:20, year:2 },
    { id:'c3', label:'Ús de draps de microfibra reutilitzables',  pct:15, year:2 },
    { id:'c4', label:'Sistema de dosificació automàtica',         pct:10, year:3 },
  ],
};

const CAT_META = {
  electricity:{ label:'Energia',     icon:'⚡', color:'elec',     unit:'kWh', costPer:0.18, hasCost:true  },
  water:      { label:'Aigua',       icon:'💧', color:'water',    unit:'m³',  costPer:2.45, hasCost:true  },
  supplies:   { label:'Consumibles', icon:'📄', color:'supplies', unit:'€',   costPer:1,    hasCost:false },
  cleaning:   { label:'Neteja',      icon:'🧹', color:'cleaning', unit:'€',   costPer:1,    hasCost:false },
};

// ─── State ────────────────────────────────────────────────────────────────────

let DATA          = null;
let chartInstance = null;
let isDark        = false;
const checkedMeasures = new Set();

// ─── Theme ────────────────────────────────────────────────────────────────────

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  const btn = document.getElementById('themeBtn');
  if (isDark) {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 10A6 6 0 016 3a6 6 0 100 10 6 6 0 007-3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg> Dark mode`;
  } else {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Light mode`;
  }
  if (chartInstance) renderChart();
  renderBreakdownChart();
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('panel-' + tab).classList.remove('hidden');
  if (tab === 'charts' && DATA) setTimeout(() => { renderChart(); renderBreakdownChart(); }, 50);
  if (tab === 'calcs' && DATA) updateCalcResults();
}

// ─── Status ───────────────────────────────────────────────────────────────────

function setStatus(type, text) {
  document.getElementById('statusDot').className = 'status-dot ' + type;
  document.getElementById('statusText').textContent = text;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

function parseDocuments(json) {
  const docs = json.documents || [];
  const energyReports   = docs.filter(d => d.document_type === 'energy_report');
  const totalKwh        = energyReports.reduce((s,d) => s + (d.total_production_kwh||0), 0);
  const electricity_kwh = energyReports.length > 0 ? Math.round((totalKwh/energyReports.length)*12) : 0;

  const waterDocs       = docs.filter(d => d.document_type === 'water_consumption');
  const avgL            = waterDocs.length > 0 ? waterDocs.reduce((s,d) => s+(d.average_consumption_liters||0),0)/waterDocs.length : 0;
  const water_m3        = Math.round(avgL * 365 / 1000);

  const officeInvoices  = docs.filter(d => d.category === 'office_supplies');
  const supplies_eur    = Math.round(officeInvoices.reduce((s,d)=>s+(d.total_amount||0),0) / uniqueMonths(officeInvoices) * 12);

  const cleaningInvoices= docs.filter(d => d.category === 'cleaning');
  const cleaning_eur    = Math.round(cleaningInvoices.reduce((s,d)=>s+(d.total_amount||0),0) / uniqueMonths(cleaningInvoices) * 12);

  return { electricity:electricity_kwh, water:water_m3, supplies:supplies_eur, cleaning:cleaning_eur };
}

function uniqueMonths(docs) {
  return new Set(docs.map(d => (d.date||'').slice(0,7))).size || 1;
}

function isSandboxed() {
  try {
    const h = window.location.hostname;
    if (!h || h==='') return true;
    if (/codepen\.io|jsfiddle\.net|stackblitz\.com|csb\.app|codesandbox\.io/.test(h)) return true;
    if (window.self !== window.top) return true;
  } catch(e) { return true; }
  return false;
}

async function autoLoad() {
  if (isSandboxed()) {
    DATA = parseDocuments(FALLBACK_DATA);
    setStatus('ok','Data loaded (bundled)');
    renderAll(); return;
  }
  setStatus('loading','Loading data from GitHub…');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res   = await fetch(JSON_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    DATA = parseDocuments(await res.json());
    setStatus('ok','Data loaded — dataclean.json · ITB2526-LiamTebar');
    renderAll();
  } catch(e) {
    DATA = parseDocuments(FALLBACK_DATA);
    setStatus('ok','Loaded from bundled data — GitHub unreachable');
    renderAll();
  }
}

function getVal(key) { return (DATA && DATA[key]) ? DATA[key] : 0; }

// ─── Seasonal helpers ─────────────────────────────────────────────────────────

function seasonalMonthly(key, annualOverride) {
  const annual   = annualOverride !== undefined ? annualOverride : getVal(key);
  const seasonal = SEASONAL[key] || Array(12).fill(1);
  const holidays = HOLIDAY_FACTORS[key] || Array(12).fill(1);
  const combined = seasonal.map((s,i) => s * holidays[i]);
  const total    = combined.reduce((a,b) => a+b, 0);
  return combined.map(f => Math.round((annual/total)*f*10)/10);
}

function sumMonths(key, months, annualOverride) {
  return seasonalMonthly(key, annualOverride).reduce((acc,v,i) => months.includes(i) ? acc+v : acc, 0);
}

function buildMonthRange(from, to) {
  const ms = [];
  if (from <= to) { for (let i=from;i<=to;i++) ms.push(i); }
  else { for (let i=from;i<12;i++) ms.push(i); for (let i=0;i<=to;i++) ms.push(i); }
  return ms;
}

// ─── Optimisation helpers ─────────────────────────────────────────────────────

function getEffectiveReduction(category) {
  let rem = 1.0;
  MEASURES[category].forEach(m => { if (checkedMeasures.has(m.id)) rem *= (1-m.pct/100); });
  return 1 - rem;
}

function getProjectedValue(category) {
  return Math.round(getVal(category) * (1 - getEffectiveReduction(category)) * 10) / 10;
}

// ─── Render all ───────────────────────────────────────────────────────────────

function renderAll() {
  document.getElementById('errorSection').style.display = 'none';
  document.getElementById('mainContent').style.display  = 'block';
  renderMetrics();
  renderSimulator();
  renderCalcs();          // render calcs on load so they're ready
  renderBreakdownChart(); // FIX: also render breakdown on load
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function renderMetrics() {
  const elec = getVal('electricity'), water = getVal('water');
  const supp = getVal('supplies'),    clean = getVal('cleaning');
  const co2  = Math.round(elec * 0.233);
  const acadElec = Math.round(sumMonths('electricity', SCHOOL_MONTHS));

  document.getElementById('metricsGrid').innerHTML = [
    { label:'Electricity',     value:elec.toLocaleString('ca'),      unit:'kWh / any'    },
    { label:'Water',           value:water.toLocaleString('ca'),     unit:'m³ / any'     },
    { label:'Office supplies', value:supp.toLocaleString('ca'),      unit:'€ / any'      },
    { label:'Cleaning',        value:clean.toLocaleString('ca'),     unit:'€ / any'      },
    { label:'CO₂ equivalent',  value:co2.toLocaleString('ca'),       unit:'kg CO₂ eq.'   },
    { label:'Any acadèmic',    value:acadElec.toLocaleString('ca'),  unit:'kWh (Set–Jun)'},
  ].map(c => `
    <div class="metric-card">
      <div class="m-label">${c.label}</div>
      <div class="m-value">${c.value}</div>
      <div class="m-unit">${c.unit}</div>
    </div>`).join('');
}

// ─── SIMULATOR ───────────────────────────────────────────────────────────────
// NOTE: calc grid is now in its own tab (panel-calcs), so simContent only
//       renders the left measure checkboxes + right live-results panel.

function renderSimulator() {
  const container = document.getElementById('simContent');
  if (!container) return;

  const colsHtml = Object.keys(MEASURES).map(cat => {
    const meta = CAT_META[cat];
    return `
      <div class="sim-col">
        <div class="sim-col-header ${meta.color}">
          <span class="sim-col-icon">${meta.icon}</span>
          <span class="sim-col-label">${meta.label}</span>
        </div>
        <div class="sim-measures">
          ${MEASURES[cat].map(m => `
            <label class="sim-measure${checkedMeasures.has(m.id)?' checked':''}" id="lbl_${m.id}">
              <input type="checkbox" id="chk_${m.id}"
                ${checkedMeasures.has(m.id)?'checked':''}
                onchange="toggleMeasure('${m.id}','${cat}')">
              <span class="sim-measure-text">${m.label}</span>
              <span class="sim-measure-pct">−${m.pct}%</span>
            </label>`).join('')}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="sim-layout">
      <div class="sim-left">
        <div class="section-label">Mesures de reducció aplicables</div>
        <div class="sim-cols">${colsHtml}</div>
      </div>
      <div class="sim-right">
        <div class="section-label">Resultats en temps real</div>
        <div id="simResults"></div>
      </div>
    </div>`;

  renderSimResults();
}

function toggleMeasure(id, cat) {
  const chk = document.getElementById('chk_'+id);
  const lbl = document.getElementById('lbl_'+id);
  if (chk.checked) { checkedMeasures.add(id); lbl.classList.add('checked'); }
  else             { checkedMeasures.delete(id); lbl.classList.remove('checked'); }
  renderSimResults();
  updateCalcResults();
  renderBreakdownChart(); // keep breakdown in sync with measures
}

function renderSimResults() {
  const el = document.getElementById('simResults');
  if (!el) return;

  let totalBase = 0, totalProj = 0;

  const rows = ['electricity','water','supplies','cleaning'].map(cat => {
    const meta   = CAT_META[cat];
    const base   = getVal(cat);
    const proj   = getProjectedValue(cat);
    const red    = getEffectiveReduction(cat);
    const redPct = Math.round(red * 100);

    // FIX: unify cost calculation — hasCost categories show physical unit + €,
    //      non-hasCost categories (supplies, cleaning) are already in €.
    const baseCost = meta.hasCost ? Math.round(base * meta.costPer) : Math.round(base);
    const projCost = meta.hasCost ? Math.round(proj * meta.costPer) : Math.round(proj);
    totalBase += baseCost;
    totalProj += projCost;
    const saving = baseCost - projCost;

    const baseStr = meta.hasCost
      ? `${base.toLocaleString('ca')} ${meta.unit} &nbsp;·&nbsp; €${baseCost.toLocaleString('ca')}`
      : `€${base.toLocaleString('ca')}`;
    const projStr = meta.hasCost
      ? `${proj.toLocaleString('ca')} ${meta.unit} &nbsp;·&nbsp; €${projCost.toLocaleString('ca')}`
      : `€${proj.toLocaleString('ca')}`;

    return `
      <div class="sr-row">
        <div class="sr-top">
          <div class="sr-left-info">
            <span class="sr-icon-badge ${meta.color}">${meta.icon}</span>
            <div>
              <div class="sr-cat-label">${meta.label}</div>
              <div class="sr-base-val">${baseStr}</div>
            </div>
          </div>
          <div class="sr-right-info">
            <div class="sr-proj-val${redPct>0?' improved':''}">${projStr}</div>
            ${redPct > 0
              ? `<div class="sr-saving-badge">−${redPct}% &nbsp;·&nbsp; estalvi €${saving.toLocaleString('ca')}</div>`
              : `<div class="sr-saving-badge neutral">sense canvis</div>`}
          </div>
        </div>
        <div class="sr-progress">
          <div class="sr-progress-fill ${meta.color}" style="width:${Math.round((1-red)*100)}%"></div>
          ${redPct > 0 ? `<div class="sr-progress-saved" style="width:${redPct}%"></div>` : ''}
        </div>
      </div>`;
  }).join('');

  const totalSaving = totalBase - totalProj;
  const totalPct    = totalBase > 0 ? Math.round(totalSaving/totalBase*100) : 0;

  el.innerHTML = `
    <div class="sr-list">${rows}</div>
    <div class="sr-total-bar${totalSaving>0?' saving':''}">
      <span class="sr-total-label">Cost anual total</span>
      <span class="sr-total-vals">
        <span class="sr-total-base${totalSaving>0?' striked':''}">€${totalBase.toLocaleString('ca')}</span>
        ${totalSaving > 0 ? `
          <span class="sr-arrow">→</span>
          <span class="sr-total-new">€${totalProj.toLocaleString('ca')}</span>
          <span class="sr-total-tag">−${totalPct}%&nbsp; estalvi €${totalSaving.toLocaleString('ca')}</span>
        ` : ''}
      </span>
    </div>`;
}

// ─── Calculations (now in its own tab) ───────────────────────────────────────

function monthOptions(sel) {
  return MONTHS.map((m,i) => `<option value="${i}"${i===sel?' selected':''}>${m}</option>`).join('');
}

function getCalcDefinitions() {
  return [
    { id:'c1', cat:'electricity', title:'Electricitat — any vinent',
      desc:'Projecció anual amb tendència ajustable.',
      inputs:`<div class="input-row"><label>Variació</label><input type="number" id="c1_var" value="3" min="-50" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c1_var')?.value||0);
        const p=Math.round(getProjectedValue('electricity')*(1+v/100));
        return { main:p.toLocaleString('ca')+' kWh', sec:`Cost estimat: €${Math.round(p*0.18).toLocaleString('ca')}` };
      }},
    { id:'c2', cat:'electricity', title:'Electricitat — periode personalitzat',
      desc:'Consum estimat entre dos mesos seleccionats.',
      inputs:`<div class="input-row"><label>De</label><select id="c2_from" onchange="updateCalcResults()">${monthOptions(8)}</select><label>a</label><select id="c2_to" onchange="updateCalcResults()">${monthOptions(11)}</select></div>`,
      calc() {
        const f=parseInt(document.getElementById('c2_from')?.value??8);
        const t=parseInt(document.getElementById('c2_to')?.value??11);
        const ms=buildMonthRange(f,t);
        const v=Math.round(sumMonths('electricity',ms,getProjectedValue('electricity')));
        return { main:v.toLocaleString('ca')+' kWh', sec:`${ms.length} mes(os)` };
      }},
    { id:'c3', cat:'water', title:'Aigua — any vinent',
      desc:'Projecció anual amb cicle escolar i estacional.',
      inputs:`<div class="input-row"><label>Variació</label><input type="number" id="c3_var" value="2" min="-50" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c3_var')?.value||0);
        const p=Math.round(getProjectedValue('water')*(1+v/100)*10)/10;
        return { main:p.toLocaleString('ca')+' m³', sec:`Cost estimat: €${Math.round(p*2.45).toLocaleString('ca')}` };
      }},
    { id:'c4', cat:'water', title:'Aigua — periode personalitzat',
      desc:'Consum estimat per un rang de mesos.',
      inputs:`<div class="input-row"><label>De</label><select id="c4_from" onchange="updateCalcResults()">${monthOptions(8)}</select><label>a</label><select id="c4_to" onchange="updateCalcResults()">${monthOptions(11)}</select></div>`,
      calc() {
        const f=parseInt(document.getElementById('c4_from')?.value??8);
        const t=parseInt(document.getElementById('c4_to')?.value??11);
        const ms=buildMonthRange(f,t);
        const v=Math.round(sumMonths('water',ms,getProjectedValue('water'))*10)/10;
        return { main:v.toLocaleString('ca')+' m³', sec:`${ms.length} mes(os)` };
      }},
    { id:'c5', cat:'supplies', title:'Consumibles — any vinent',
      desc:'Projecció de despesa en material fungible.',
      inputs:`<div class="input-row"><label>Variació</label><input type="number" id="c5_var" value="-5" min="-80" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c5_var')?.value||0);
        const p=Math.round(getProjectedValue('supplies')*(1+v/100));
        const diff=p-Math.round(getVal('supplies'));
        return { main:'€'+p.toLocaleString('ca'), sec:`${diff>=0?'+':''}€${diff.toLocaleString('ca')} vs base` };
      }},
    { id:'c6', cat:'supplies', title:'Consumibles — curs escolar',
      desc:'Despesa estimada de setembre a juny.',
      inputs:'',
      calc() {
        const p=getProjectedValue('supplies');
        const v=Math.round(sumMonths('supplies',SCHOOL_MONTHS,p));
        return { main:'€'+v.toLocaleString('ca'), sec:`${p>0?Math.round(v/p*100):0}% del total anual` };
      }},
    { id:'c7', cat:'cleaning', title:'Neteja — any vinent',
      desc:'Projecció de despesa en productes de neteja.',
      inputs:`<div class="input-row"><label>Variació</label><input type="number" id="c7_var" value="0" min="-80" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c7_var')?.value||0);
        const p=Math.round(getProjectedValue('cleaning')*(1+v/100));
        const diff=p-Math.round(getVal('cleaning'));
        return { main:'€'+p.toLocaleString('ca'), sec:`${diff>=0?'+':''}€${diff.toLocaleString('ca')} vs base` };
      }},
    { id:'c8', cat:'cleaning', title:'Neteja — periode personalitzat',
      desc:'Despesa estimada en neteja per un rang de mesos.',
      inputs:`<div class="input-row"><label>De</label><select id="c8_from" onchange="updateCalcResults()">${monthOptions(8)}</select><label>a</label><select id="c8_to" onchange="updateCalcResults()">${monthOptions(11)}</select></div>`,
      calc() {
        const f=parseInt(document.getElementById('c8_from')?.value??8);
        const t=parseInt(document.getElementById('c8_to')?.value??11);
        const ms=buildMonthRange(f,t);
        const v=Math.round(sumMonths('cleaning',ms,getProjectedValue('cleaning')));
        return { main:'€'+v.toLocaleString('ca'), sec:`${ms.length} mes(os)` };
      }},
  ];
}

function renderCalcs() {
  const calcs = getCalcDefinitions();
  window._calcs = calcs;
  const grid = document.getElementById('calcGrid');
  if (!grid) return;
  grid.innerHTML = calcs.map(c => `
    <div class="calc-card">
      <div class="calc-cat-dot ${c.cat}"></div>
      <h3>${c.title}</h3>
      <div class="calc-desc">${c.desc}</div>
      ${c.inputs}
      <div class="calc-result">
        <div class="r-label">Resultat</div>
        <div class="r-val" id="rval_${c.id}">—</div>
        <div class="r-secondary" id="rsec_${c.id}"></div>
      </div>
    </div>`).join('');
  updateCalcResults();
}

function updateCalcResults() {
  if (!window._calcs) return;
  window._calcs.forEach(c => {
    try {
      const { main, sec } = c.calc();
      const rv = document.getElementById('rval_'+c.id);
      const rs = document.getElementById('rsec_'+c.id);
      if (rv) rv.textContent = main;
      if (rs) rs.textContent = sec || '';
    } catch(e) {}
  });
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function renderChart() {
  const key  = document.getElementById('chartIndicator')?.value || 'electricity';
  const data = seasonalMonthly(key);
  const COLOR = {
    school:  isDark?'#4db87a':'#1a5c3a',
    holiday: isDark?'#e07840':'#b85c1a',
    break:   isDark?'#3a3a35':'#d4d2cc',
  };
  const tickColor = isDark?'#6b6a65':'#9b9a95';
  const gridColor = isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)';

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const ctx = document.getElementById('monthlyChart')?.getContext('2d');
  if (!ctx) return;

  const CLABELS = { school:'Mes lectiu', holiday:'Vacances', break:'Estiu' };
  chartInstance = new Chart(ctx, {
    type:'bar',
    data:{ labels:MONTHS, datasets:[{ label:key, data,
      backgroundColor:MONTH_TYPE.map(t=>COLOR[t]), borderRadius:4, borderSkipped:false }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        tooltip:{ callbacks:{ label:c=>` ${c.parsed.y.toFixed(1)} — ${CLABELS[MONTH_TYPE[c.dataIndex]]}` }}
      },
      scales:{
        x:{ ticks:{color:tickColor,font:{size:11},autoSkip:false}, grid:{display:false}, border:{display:false} },
        y:{ ticks:{color:tickColor,font:{size:11}}, grid:{color:gridColor}, border:{display:false} }
      }
    }
  });
  updateChartLegend();
}

function updateChartLegend() {
  const el = document.getElementById('chartLegend');
  if (!el) return;
  el.innerHTML = [
    { color:isDark?'#4db87a':'#1a5c3a', label:'Mes lectiu'  },
    { color:isDark?'#e07840':'#b85c1a', label:'Vacances'    },
    { color:isDark?'#3a3a35':'#d4d2cc', label:'Estiu'       },
  ].map(it => `<span class="legend-item"><span class="legend-dot" style="background:${it.color}"></span>${it.label}</span>`).join('');
}

// FIX: renderBreakdownChart — corrected cost calculation so supplies/cleaning
//      (which are already in €) don't get multiplied by a costPer factor,
//      and the bd-sub shows the right label for each type.
function renderBreakdownChart() {
  const barsEl  = document.getElementById('breakdownBars');
  const totalEl = document.getElementById('breakdownTotal');
  if (!barsEl) return;

  const elec  = getVal('electricity');
  const water = getVal('water');
  const supp  = getVal('supplies');
  const clean = getVal('cleaning');

  // hasCost=true → convert physical unit to €; hasCost=false → already €
  const elecCost  = Math.round(elec  * 0.18);
  const waterCost = Math.round(water * 2.45);
  const suppCost  = Math.round(supp);
  const cleanCost = Math.round(clean);
  const grandTotal = elecCost + waterCost + suppCost + cleanCost;

  const items = [
    { label:'Energia',     value:elecCost,  rawVal:elec,  rawUnit:'kWh', color:isDark?'#4db87a':'#1a5c3a' },
    { label:'Aigua',       value:waterCost, rawVal:water, rawUnit:'m³',  color:isDark?'#4a9fd4':'#1a6a9a' },
    { label:'Consumibles', value:suppCost,  rawVal:null,  rawUnit:'',    color:isDark?'#9a70e0':'#5a3ab0' },
    { label:'Neteja',      value:cleanCost, rawVal:null,  rawUnit:'',    color:isDark?'#e07840':'#b07c10' },
  ];

  barsEl.innerHTML = items.map(item => {
    const pct = grandTotal > 0 ? Math.round(item.value / grandTotal * 100) : 0;
    const bp  = grandTotal > 0 ? (item.value / grandTotal * 100) : 0;
    // FIX: sub-label — physical categories show "X unit · €Y", direct-€ ones just "€Y/any"
    const sub = item.rawVal !== null
      ? `${item.rawVal.toLocaleString('ca')} ${item.rawUnit} &nbsp;·&nbsp; €${item.value.toLocaleString('ca')}`
      : `€${item.value.toLocaleString('ca')} / any`;

    return `<div class="bd-row">
      <div class="bd-label">${item.label}</div>
      <div class="bd-bar-wrap"><div class="bd-bar" style="width:${bp.toFixed(1)}%;background:${item.color}"></div></div>
      <div class="bd-right"><span class="bd-pct">${pct}%</span><span class="bd-sub">${sub}</span></div>
    </div>`;
  }).join('');

  if (totalEl) totalEl.innerHTML = `Cost anual estimat total&ensp;<strong>€${grandTotal.toLocaleString('ca')}</strong>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', autoLoad);
