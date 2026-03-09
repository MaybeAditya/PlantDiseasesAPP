// --- Elements ---
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const dropArea = document.getElementById("dropArea");
const resultDiv = document.getElementById("result");
const errorModal = document.getElementById("errorModal");
const themeToggle = document.getElementById("themeToggle");
const imageWrapper = document.getElementById("imageWrapper");
const scannerLine = document.getElementById("scannerLine");
const terminalOutput = document.getElementById("terminalOutput");
const cacheMetrics = document.getElementById("cacheMetrics");

let file;
let chartInstance = null;
let terminalInterval;
let map;
let mapInitialized = false;

// --- Tab Switching ---
window.switchTab = function(tabId, event) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.remove('hidden');
  event.currentTarget.classList.add('active');
  
  // Leaflet needs to recalculate size when unhidden
  if(tabId === 'map') {
    if (!mapInitialized) initMap();
    setTimeout(() => map.invalidateSize(), 100);
  }
}

// --- Theme & Modal ---
themeToggle.onclick = () => {
  const currentTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", currentTheme === "light" ? "dark" : "light");
  themeToggle.innerText = currentTheme === "light" ? "☀️ Light Mode" : "🌙 Dark Mode";
};
document.getElementById("closeModal").onclick = () => errorModal.classList.add("hidden");

// --- Upload UI ---
dropArea.onclick = () => fileInput.click();

fileInput.onchange = e => {
  file = e.target.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    imageWrapper.classList.remove("hidden");
    resultDiv.classList.add("hidden");
    cacheMetrics.classList.add("hidden");
  }
};

// --- Fake Cache Metrics ---
const indianCities = ["Bangalore", "Gurugram", "Noida", "Hyderabad", "Pune", "Chennai"];
function updateCacheTerminal() {
  const isHit = Math.random() > 0.3;
  const city = indianCities[Math.floor(Math.random() * indianCities.length)];
  if (isHit) {
    cacheMetrics.innerText = `> [Cache HIT] Vector data retrieved from ${city} Edge (1${Math.floor(Math.random()*9)}ms)`;
    cacheMetrics.style.color = "#22c55e";
  } else {
    cacheMetrics.innerText = `> [Cache MISS] Cold start querying main Vector DB (8${Math.floor(Math.random()*99)}ms)`;
    cacheMetrics.style.color = "#a855f7";
  }
}

// --- Analysis Engine ---
const scanSteps = [
  "> Initiating image pre-processing...",
  "> Running edge detection algorithms...",
  "> Querying distributed vector database...",
  "> Calculating multi-class confidence matrix...",
  "> Finalizing tensor evaluations..."
];

analyzeBtn.onclick = async () => {
  if (!file) return alert("Please upload an image first.");

  analyzeBtn.innerText = "Processing Pipeline...";
  analyzeBtn.disabled = true;
  imageWrapper.classList.add("scanning");
  scannerLine.classList.remove("hidden");
  terminalOutput.classList.remove("hidden");
  cacheMetrics.classList.remove("hidden");
  resultDiv.classList.add("hidden");

  let step = 0;
  terminalOutput.innerText = scanSteps[0];
  terminalInterval = setInterval(() => {
    step = (step + 1) % scanSteps.length;
    terminalOutput.innerText = scanSteps[step];
    updateCacheTerminal();
  }, 800);

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });

      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      showResult(data);
    } catch (error) {
      errorModal.classList.remove("hidden");
    } finally {
      clearInterval(terminalInterval);
      imageWrapper.classList.remove("scanning");
      scannerLine.classList.add("hidden");
      terminalOutput.innerText = "> System idle...";
      analyzeBtn.innerText = "Run Analysis";
      analyzeBtn.disabled = false;
    }
  };
  reader.readAsDataURL(file);
};

// --- UI Updates & Radar Chart ---
function showResult(data) {
  resultDiv.classList.remove("hidden");
  document.getElementById("prediction").innerText = data.prediction || "Unknown";
  document.getElementById("confidence").innerText = "Confidence: " + (data.confidence || 0) + "%";
  document.getElementById("fill").style.width = (data.confidence || 0) + "%";
  document.getElementById("health").innerText = "Health Score: " + (100 - (data.confidence || 0));
  
  let severity = "Low";
  if (data.confidence > 85) severity = "High";
  else if (data.confidence > 60) severity = "Moderate";
  document.getElementById("severity").innerText = "Severity: " + severity;
  
  document.getElementById("summary").innerText = data.summary || "No summary provided.";

  const list = document.getElementById("recs");
  list.innerHTML = "";
  if (data.recommendations) {
    data.recommendations.forEach(r => {
      const li = document.createElement("li");
      li.innerText = r;
      list.appendChild(li);
    });
  }

  // Radar Chart
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: [data.prediction || 'Primary', 'Early Blight', 'Leaf Mold', 'Target Spot', 'Healthy'],
      datasets: [{
        label: 'Probability Matrix',
        data: [data.confidence || 0, Math.floor(Math.random()*20), Math.floor(Math.random()*15), Math.floor(Math.random()*10), Math.floor(Math.random()*5)],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: '#22c55e',
        borderWidth: 2
      }]
    },
    options: { scales: { r: { ticks: { display: false, max: 100, min: 0 } } }, plugins: { legend: { display: false } } }
  });
}

// --- Fake Live Indian Ticker ---
const diseases = ["Early Blight", "Healthy", "Powdery Mildew", "Leaf Spot", "Rust", "Yellow Leaf Curl"];
function generateTicker() {
  let html = '';
  for(let i=0; i<10; i++) {
    const city = indianCities[Math.floor(Math.random() * indianCities.length)];
    const disease = diseases[Math.floor(Math.random() * diseases.length)];
    const conf = Math.floor(Math.random() * 20) + 80;
    html += `<div class="ticker-item">[WSS] Stream routed from ${city}: ${disease} (${conf}%)</div>`;
  }
  document.getElementById("liveTicker").innerHTML = html;
}
generateTicker();
setInterval(generateTicker, 25000);

// --- Geospatial Map (India Focus) ---
function initMap() {
  map = L.map('leafletMap').setView([22.5937, 78.9629], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

  for(let i=0; i<20; i++) {
    const lat = 10 + (Math.random() * 20); 
    const lng = 70 + (Math.random() * 20);
    const d = diseases[Math.floor(Math.random() * diseases.length)];
    L.circleMarker([lat, lng], { color: '#ef4444', radius: 8, fillOpacity: 0.6 })
     .addTo(map)
     .bindPopup(`<b>Threat Detected</b><br>${d} cluster active.`);
  }
  mapInitialized = true;
}

// Clear UI
clearBtn.onclick = () => {
  file = null;
  fileInput.value = "";
  imageWrapper.classList.add("hidden");
  resultDiv.classList.add("hidden");
  terminalOutput.classList.add("hidden");
  cacheMetrics.classList.add("hidden");
  if(chartInstance) chartInstance.destroy();
};