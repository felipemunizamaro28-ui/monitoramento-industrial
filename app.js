// ============================================================
// IHM - MONITORAMENTO INDUSTRIAL
// Motor Trifásico + Bomba Hidráulica
// VERSÃO ATUAL: dados simulados
// FUTURO: substituir as funções de dados pela API do backend.
// ============================================================

const state = {
  motorHistory: [],
  pumpHistory: [],
  maxHistory: 18,
  currentDashboard: "motor"
};

// Limites de demonstração da interface. NÃO são limites de segurança.
// Devem ser substituídos pelos valores definidos para os equipamentos reais.
const LIMITS = {
  motor: {
    temperatureWarning: 65, temperatureDanger: 80,
    currentWarning: 12, currentDanger: 15,
    vibrationWarning: 6, vibrationDanger: 10
  },
  pump: {
    pressureWarning: 6, pressureDanger: 8,
    flowWarning: 20, flowDanger: 15,
    temperatureWarning: 60, temperatureDanger: 75,
    vibrationWarning: 6, vibrationDanger: 10
  }
};

const $ = (id) => document.getElementById(id);

function formatNumber(value, decimals = 1) {
  return Number(value).toFixed(decimals);
}

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

function getParameterState(value, warning, danger) {
  if (value >= danger) return "danger";
  if (value >= warning) return "warning";
  return "normal";
}

function stateLabel(status) {
  if (status === "danger") return "Alerta";
  if (status === "warning") return "Atenção";
  return "Normal";
}

function overallState(statuses) {
  if (statuses.includes("danger")) return "danger";
  if (statuses.includes("warning")) return "warning";
  return "normal";
}

// ------------------------------------------------------------
// FONTES DE DADOS SIMULADOS
// ------------------------------------------------------------

async function getMotorData() {
  const time = Date.now() / 1000;
  return {
    temperature: 42.3 + Math.sin(time / 15) * 1.8 + (Math.random() - 0.5) * 0.4,
    current: 8.7 + Math.sin(time / 11) * 0.5 + (Math.random() - 0.5) * 0.15,
    vibrationX: 2.4 + Math.sin(time / 5) * 0.25 + (Math.random() - 0.5) * 0.08,
    vibrationY: 1.8 + Math.cos(time / 6) * 0.22 + (Math.random() - 0.5) * 0.08
  };
}

async function getPumpData() {
  const time = Date.now() / 1000;
  return {
    pressure: 4.8 + Math.sin(time / 10) * 0.35 + (Math.random() - 0.5) * 0.08,
    flow: 32.4 + Math.cos(time / 12) * 1.8 + (Math.random() - 0.5) * 0.5,
    temperature: 38.6 + Math.sin(time / 16) * 1.2 + (Math.random() - 0.5) * 0.3,
    vibration: 2.1 + Math.sin(time / 6) * 0.22 + (Math.random() - 0.5) * 0.08
  };
}

// ------------------------------------------------------------
// ATUALIZAÇÃO DO MOTOR
// ------------------------------------------------------------

function updateMotorDashboard(data) {
  const t = getParameterState(data.temperature, LIMITS.motor.temperatureWarning, LIMITS.motor.temperatureDanger);
  const c = getParameterState(data.current, LIMITS.motor.currentWarning, LIMITS.motor.currentDanger);
  const x = getParameterState(data.vibrationX, LIMITS.motor.vibrationWarning, LIMITS.motor.vibrationDanger);
  const y = getParameterState(data.vibrationY, LIMITS.motor.vibrationWarning, LIMITS.motor.vibrationDanger);
  const overall = overallState([t, c, x, y]);

  updateMetric("temperatureValue", data.temperature, "temperatureState", t);
  updateMetric("currentValue", data.current, "currentState", c);
  updateMetric("vibrationXValue", data.vibrationX, "vibrationXState", x);
  updateMetric("vibrationYValue", data.vibrationY, "vibrationYState", y);

  $("chartTempCurrent").textContent = `${formatNumber(data.temperature)} °C`;
  $("chartCurrentCurrent").textContent = `${formatNumber(data.current)} A`;

  setStatus("motorStatus", "statusDescription", "statusIndicator", "alertPanel", "alertTitle", "alertMessage", overall, "Motor em operação", "Motor em observação", "Atenção necessária", "Todos os parâmetros estão dentro da faixa configurada.", "Foi identificada uma leitura acima da faixa normal.", "Um ou mais parâmetros ultrapassaram o limite de alerta.");
}

function updateMetric(valueId, value, stateId, status) {
  $(valueId).textContent = formatNumber(value);
  $(stateId).textContent = stateLabel(status);
  $(stateId).className = `state ${status}`;
}

// ------------------------------------------------------------
// ATUALIZAÇÃO DA BOMBA
// ------------------------------------------------------------

function updatePumpDashboard(data) {
  const p = getParameterState(data.pressure, LIMITS.pump.pressureWarning, LIMITS.pump.pressureDanger);
  // Para vazão, valores abaixo do limite representam condição de atenção.
  const flow = data.flow <= LIMITS.pump.flowDanger ? "danger" : data.flow <= LIMITS.pump.flowWarning ? "warning" : "normal";
  const t = getParameterState(data.temperature, LIMITS.pump.temperatureWarning, LIMITS.pump.temperatureDanger);
  const v = getParameterState(data.vibration, LIMITS.pump.vibrationWarning, LIMITS.pump.vibrationDanger);
  const overall = overallState([p, flow, t, v]);

  updateMetric("pressureValue", data.pressure, "pressureState", p);
  updateMetric("flowValue", data.flow, "flowState", flow);
  updateMetric("pumpTemperatureValue", data.temperature, "pumpTemperatureState", t);
  updateMetric("pumpVibrationValue", data.vibration, "pumpVibrationState", v);

  $("chartPressureCurrent").textContent = `${formatNumber(data.pressure)} bar`;
  $("chartFlowCurrent").textContent = `${formatNumber(data.flow)} L/min`;
  $("chartPumpTempCurrent").textContent = `${formatNumber(data.temperature)} °C`;

  setStatus("pumpStatus", "pumpStatusDescription", "pumpStatusIndicator", "pumpAlertPanel", "pumpAlertTitle", "pumpAlertMessage", overall, "Bomba em operação", "Bomba em observação", "Atenção necessária", "Todos os parâmetros estão dentro da faixa configurada.", "Foi identificada uma leitura fora da faixa normal.", "Um ou mais parâmetros ultrapassaram o limite de alerta.");
}

function setStatus(statusId, descId, indicatorId, alertPanelId, alertTitleId, alertMessageId, status, normalTitle, warningTitle, dangerTitle, normalDesc, warningDesc, dangerDesc) {
  const indicator = $(indicatorId);
  const panel = $(alertPanelId);
  const icon = panel.querySelector(".alert-icon");

  if (status === "danger") {
    $(statusId).textContent = dangerTitle;
    $(descId).textContent = dangerDesc;
    indicator.innerHTML = "<span></span> ALERTA";
    indicator.style.background = "var(--red-soft)";
    indicator.style.color = "var(--red)";
    panel.style.borderLeftColor = "var(--red)";
    icon.style.background = "var(--red-soft)";
    icon.style.color = "var(--red)";
    $(alertTitleId).textContent = "Condição de alerta";
    $(alertMessageId).textContent = "Verifique os parâmetros do equipamento.";
  } else if (status === "warning") {
    $(statusId).textContent = warningTitle;
    $(descId).textContent = warningDesc;
    indicator.innerHTML = "<span></span> ATENÇÃO";
    indicator.style.background = "var(--orange-soft)";
    indicator.style.color = "var(--orange)";
    panel.style.borderLeftColor = "var(--orange)";
    icon.style.background = "var(--orange-soft)";
    icon.style.color = "var(--orange)";
    $(alertTitleId).textContent = "Atenção";
    $(alertMessageId).textContent = "Uma das variáveis está fora da faixa normal.";
  } else {
    $(statusId).textContent = normalTitle;
    $(descId).textContent = normalDesc;
    indicator.innerHTML = "<span></span> NORMAL";
    indicator.style.background = "var(--green-soft)";
    indicator.style.color = "var(--green)";
    panel.style.borderLeftColor = "var(--green)";
    icon.style.background = "var(--green-soft)";
    icon.style.color = "var(--green)";
    $(alertTitleId).textContent = "Sistema monitorado";
    $(alertMessageId).textContent = "Nenhuma condição de alerta detectada.";
  }
}

// ------------------------------------------------------------
// GRÁFICOS
// ------------------------------------------------------------

const chartCommon = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { intersect: false, mode: "index" },
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#858992", font: { size: 9 } } },
    y: { grid: { color: "#eceef1" }, ticks: { color: "#858992", font: { size: 9 } } }
  }
};

function makeLineChart(id, borderColor, fillColor, suggestedMin, suggestedMax) {
  return new Chart($(id), {
    type: "line",
    data: { labels: [], datasets: [{ data: [], borderColor, backgroundColor: fillColor, fill: true, borderWidth: 2, tension: 0.35, pointRadius: 0 }] },
    options: { ...chartCommon, scales: { ...chartCommon.scales, y: { ...chartCommon.scales.y, suggestedMin, suggestedMax } } }
  });
}

const temperatureChart = makeLineChart("temperatureChart", "#d71920", "rgba(215,25,32,.08)", 35, 55);
const currentChart = makeLineChart("currentChart", "#111214", "rgba(17,18,20,.06)", 5, 12);

const vibrationChart = new Chart($("vibrationChart"), {
  type: "line",
  data: { labels: [], datasets: [
    { label: "Eixo X", data: [], borderColor: "#d71920", borderWidth: 2, tension: .35, pointRadius: 0 },
    { label: "Eixo Y", data: [], borderColor: "#555a63", borderWidth: 2, tension: .35, pointRadius: 0 }
  ] },
  options: { ...chartCommon, scales: { ...chartCommon.scales, y: { ...chartCommon.scales.y, suggestedMin: 0, suggestedMax: 5 } } }
});

const pressureChart = makeLineChart("pressureChart", "#d71920", "rgba(215,25,32,.08)", 3, 6);
const flowChart = makeLineChart("flowChart", "#111214", "rgba(17,18,20,.06)", 20, 40);
const pumpTemperatureChart = makeLineChart("pumpTemperatureChart", "#d71920", "rgba(215,25,32,.08)", 30, 50);

function updateMotorCharts() {
  const data = [...state.motorHistory].reverse();
  const labels = data.map(item => item.time.slice(0, 5));
  temperatureChart.data.labels = labels;
  temperatureChart.data.datasets[0].data = data.map(item => item.temperature);
  currentChart.data.labels = labels;
  currentChart.data.datasets[0].data = data.map(item => item.current);
  vibrationChart.data.labels = labels;
  vibrationChart.data.datasets[0].data = data.map(item => item.vibrationX);
  vibrationChart.data.datasets[1].data = data.map(item => item.vibrationY);
  temperatureChart.update(); currentChart.update(); vibrationChart.update();
}

function updatePumpCharts() {
  const data = [...state.pumpHistory].reverse();
  const labels = data.map(item => item.time.slice(0, 5));
  pressureChart.data.labels = labels;
  pressureChart.data.datasets[0].data = data.map(item => item.pressure);
  flowChart.data.labels = labels;
  flowChart.data.datasets[0].data = data.map(item => item.flow);
  pumpTemperatureChart.data.labels = labels;
  pumpTemperatureChart.data.datasets[0].data = data.map(item => item.temperature);
  pressureChart.update(); flowChart.update(); pumpTemperatureChart.update();
}

// ------------------------------------------------------------
// HISTÓRICO
// ------------------------------------------------------------

function renderHistory() {
  const body = $("historyBody");
  const data = state.currentDashboard === "motor" ? state.motorHistory : state.pumpHistory;

  body.innerHTML = data.map(item => {
    if (state.currentDashboard === "motor") {
      const statuses = [
        getParameterState(item.temperature, LIMITS.motor.temperatureWarning, LIMITS.motor.temperatureDanger),
        getParameterState(item.current, LIMITS.motor.currentWarning, LIMITS.motor.currentDanger),
        getParameterState(item.vibrationX, LIMITS.motor.vibrationWarning, LIMITS.motor.vibrationDanger),
        getParameterState(item.vibrationY, LIMITS.motor.vibrationWarning, LIMITS.motor.vibrationDanger)
      ];
      const label = stateLabel(overallState(statuses));
      return `<tr><td>${item.time}</td><td>${formatNumber(item.temperature)} °C</td><td>${formatNumber(item.current)} A</td><td>${formatNumber(item.vibrationX)}</td><td>${formatNumber(item.vibrationY)}</td><td><span class="badge">${label}</span></td></tr>`;
    }
    const statuses = [
      getParameterState(item.pressure, LIMITS.pump.pressureWarning, LIMITS.pump.pressureDanger),
      item.flow <= LIMITS.pump.flowDanger ? "danger" : item.flow <= LIMITS.pump.flowWarning ? "warning" : "normal",
      getParameterState(item.temperature, LIMITS.pump.temperatureWarning, LIMITS.pump.temperatureDanger),
      getParameterState(item.vibration, LIMITS.pump.vibrationWarning, LIMITS.pump.vibrationDanger)
    ];
    return `<tr><td>${item.time}</td><td>${formatNumber(item.pressure)} bar</td><td>${formatNumber(item.flow)} L/min</td><td>${formatNumber(item.temperature)} °C</td><td>${formatNumber(item.vibration)}</td><td><span class="badge">${stateLabel(overallState(statuses))}</span></td></tr>`;
  }).join("");

  const headers = document.querySelectorAll("#historyBody");
  void headers;
}

function updateHistoryHeader() {
  const row = document.querySelector("#historico thead tr");
  if (state.currentDashboard === "motor") {
    row.innerHTML = `<th>Horário</th><th>Temperatura</th><th>Corrente</th><th>Vibração X</th><th>Vibração Y</th><th>Status</th>`;
  } else {
    row.innerHTML = `<th>Horário</th><th>Pressão</th><th>Vazão</th><th>Temperatura</th><th>Vibração</th><th>Status</th>`;
  }
}

// ------------------------------------------------------------
// NAVEGAÇÃO / SELEÇÃO DO EQUIPAMENTO
// ------------------------------------------------------------

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => section.classList.remove("active-section"));
  $(sectionId).classList.add("active-section");
}

function selectDashboard(type) {
  state.currentDashboard = type;
  document.querySelectorAll(".dashboard-choice").forEach(btn => btn.classList.toggle("active", btn.dataset.dashboard === type));

  if (type === "motor") {
    showSection("dashboard");
    $("pageTitle").textContent = "Motor Trifásico";
    $("pageSubtitle").textContent = "Sistema de acompanhamento de temperatura, corrente e vibração.";
  } else {
    showSection("pumpDashboard");
    $("pageTitle").textContent = "Bomba Hidráulica";
    $("pageSubtitle").textContent = "Sistema de acompanhamento de pressão, vazão, temperatura e vibração.";
  }

  $("connectionText").textContent = "Simulação ativa";
  $("lastUpdate").textContent = nowTime();
  renderHistory();
  updateHistoryHeader();
}

document.querySelectorAll(".dashboard-choice").forEach(button => {
  button.addEventListener("click", () => selectDashboard(button.dataset.dashboard));
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    if (button.dataset.section === "dashboard") {
      selectDashboard(state.currentDashboard);
      return;
    }

    showSection(button.dataset.section);
  });
});

// ------------------------------------------------------------
// ATUALIZAÇÃO DOS DADOS
// ------------------------------------------------------------

async function refreshData() {
  try {
    const motor = await getMotorData();
    const pump = await getPumpData();

    state.motorHistory.unshift({ time: nowTime(), ...motor });
    state.pumpHistory.unshift({ time: nowTime(), ...pump });
    state.motorHistory = state.motorHistory.slice(0, state.maxHistory);
    state.pumpHistory = state.pumpHistory.slice(0, state.maxHistory);

    updateMotorDashboard(motor);
    updatePumpDashboard(pump);
    updateMotorCharts();
    updatePumpCharts();
    renderHistory();

    $("liveLabel").textContent = "ONLINE";
    $("connectionText").textContent = "Simulação ativa";
    $("lastUpdate").textContent = nowTime();
  } catch (error) {
    console.error("Erro ao obter dados:", error);
    $("liveLabel").textContent = "OFFLINE";
    $("connectionText").textContent = "Sem conexão";
  }
}

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------

(async function init() {
  for (let i = 0; i < 12; i++) {
    const motor = await getMotorData();
    const pump = await getPumpData();
    const time = new Date(Date.now() - (11 - i) * 5000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    state.motorHistory.unshift({ time, ...motor });
    state.pumpHistory.unshift({ time, ...pump });
  }

  state.motorHistory = state.motorHistory.slice(0, state.maxHistory);
  state.pumpHistory = state.pumpHistory.slice(0, state.maxHistory);

  updateMotorCharts();
  updatePumpCharts();
  updateHistoryHeader();
  renderHistory();
  await refreshData();

  // Atualização simulada a cada 5 segundos.
  setInterval(refreshData, 5000);
})();
