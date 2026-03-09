// --- 1. DOM Elements ---
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const dropArea = document.getElementById("dropArea");
const resultDiv = document.getElementById("result");

// Modal & Theme Elements
const errorModal = document.getElementById("errorModal");
const closeModalBtn = document.getElementById("closeModal");
const themeToggle = document.getElementById("themeToggle");

// Scanner & Terminal Elements
const imageWrapper = document.getElementById("imageWrapper");
const scannerLine = document.getElementById("scannerLine");
const terminalOutput = document.getElementById("terminalOutput");

// State Variables
let file;
let chartInstance = null;
let terminalInterval;

const scanSteps = [
  "> Initiating image pre-processing...",
  "> Running edge detection algorithms...",
  "> Querying distributed vector database...",
  "> Calculating multi-class confidence matrix...",
  "> Finalizing tensor evaluations..."
];

// --- 2. Theme Toggle Logic ---
themeToggle.onclick = () => {
  const currentTheme = document.body.getAttribute("data-theme");
  if (currentTheme === "light") {
    document.body.setAttribute("data-theme", "dark");
    themeToggle.innerText = "☀️ Light Mode";
  } else {
    document.body.setAttribute("data-theme", "light");
    themeToggle.innerText = "🌙 Dark Mode";
  }
};

// --- 3. Modal Logic ---
closeModalBtn.onclick = () => {
  errorModal.classList.add("hidden");
};

function showErrorModal() {
  errorModal.classList.remove("hidden");
}

// --- 4. Upload Logic ---
dropArea.onclick = () => fileInput.click();

fileInput.onchange = e => {
  file = e.target.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    imageWrapper.classList.remove("hidden");
    resultDiv.classList.add("hidden");
  }
};

// --- 5. Analysis Pipeline ---
analyzeBtn.onclick = async () => {
  if (!file) {
    alert("Please upload an image first."); 
    return;
  }

  // Start Hollywood UI Scanner
  analyzeBtn.innerText = "Processing Pipeline...";
  analyzeBtn.disabled = true;
  imageWrapper.classList.add("scanning");
  scannerLine.classList.remove("hidden");
  terminalOutput.classList.remove("hidden");

  // Cycle terminal text
  let step = 0;
  terminalOutput.innerText = scanSteps[0];
  terminalInterval = setInterval(() => {
    step = (step + 1) % scanSteps.length;
    terminalOutput.innerText = scanSteps[step];
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

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Silent Backend Log:", errorData);
        showErrorModal();
        return;
      }

      const data = await res.json();
      showResult(data);

    } catch (error) {
      console.error("Network error:", error);
      showErrorModal(); 
    } finally {
      // Stop Hollywood UI Scanner
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

// --- 6. Clear UI Logic ---
clearBtn.onclick = () => {
  file = null;
  fileInput.value = "";
  preview.src = "";
  preview.style.display = "none";
  imageWrapper.classList.add("hidden");
  resultDiv.classList.add("hidden");
  terminalOutput.classList.add("hidden");
  
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
};

// --- 7. UI Update Logic ---
function showResult(data) {
  resultDiv.classList.remove("hidden");
  
  document.getElementById("prediction").innerText = data.prediction || "Unknown";
  document.getElementById("confidence").innerText = "Confidence: " + (data.confidence || 0) + "%";
  document.getElementById("fill").style.width = (data.confidence || 0) + "%";
  document.getElementById("health").innerText = "Health Score: " + (100 - (data.confidence || 0));
  document.getElementById("severity").innerText = "Severity: " + getSeverity(data.confidence);
  document.getElementById("summary").innerText = data.summary || "No summary provided.";

  const list = document.getElementById("recs");
  list.innerHTML = "";
  if (data.recommendations && Array.isArray(data.recommendations)) {
    data.recommendations.forEach(r => {
      const li = document.createElement("li");
      li.innerText = r;
      list.appendChild(li);
    });
  }

  renderRadarChart(data.prediction, data.confidence);
}

function getSeverity(c) {
  if (!c) return "Unknown";
  if (c > 85) return "High";
  if (c > 60) return "Moderate";
  return "Low";
}

// --- 8. Chart.js Radar Visualization ---
function renderRadarChart(mainDisease, mainConfidence) {
  const ctx = document.getElementById('radarChart').getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = [mainDisease || 'Primary', 'Early Blight', 'Leaf Mold', 'Target Spot', 'Healthy'];
  
  const dataPoints = [
    mainConfidence || 0, 
    Math.floor(Math.random() * 20), 
    Math.floor(Math.random() * 15), 
    Math.floor(Math.random() * 10), 
    Math.floor(Math.random() * 5)
  ];

  chartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Classification Probability',
        data: dataPoints,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#888', font: { size: 12 } },
          ticks: { display: false, max: 100, min: 0 } 
        }
      },
      plugins: {
        legend: { labels: { color: '#fff' } }
      }
    }
  });
}
// --- Tab Switching Logic ---
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.remove('hidden');
  event.target.classList.add('active');
  
  if(tabId === 'map' && !mapInitialized) initMap();
}

// --- The Fake Indian Ticker ---
const indianCities = ["Bangalore", "Gurugram", "Noida", "Hyderabad", "Pune", "Chennai"];
const diseases = ["Early Blight", "Healthy", "Powdery Mildew", "Leaf Spot", "Rust", "Yellow Leaf Curl"];
const liveTicker = document.getElementById("liveTicker");

function generateTickerData() {
  liveTicker.innerHTML = '';
  for(let i=0; i<8; i++) {
    const city = indianCities[Math.floor(Math.random() * indianCities.length)];
    const disease = diseases[Math.floor(Math.random() * diseases.length)];
    const conf = Math.floor(Math.random() * 20) + 80; // 80-99%
    liveTicker.innerHTML += `<div class="ticker-item">[WSS] Scan processed from ${city}: ${disease} (${conf}%)</div>`;
  }
}
generateTickerData();
setInterval(generateTickerData, 19000); // Refresh when off-screen

// --- Fake Cache Metrics ---
const cacheTerminal = document.getElementById("cacheMetrics");
setInterval(() => {
  const isHit = Math.random() > 0.3; // 70% cache hit rate
  const city = indianCities[Math.floor(Math.random() * indianCities.length)];
  if (isHit) {
    cacheTerminal.innerText = `> [Cache HIT] Vector data retrieved from ${city} Edge (1${Math.floor(Math.random()*9)}ms)`;
    cacheTerminal.style.color = "#22c55e";
  } else {
    cacheTerminal.innerText = `> [Cache MISS] Cold start querying main Vector DB (8${Math.floor(Math.random()*99)}ms)`;
    cacheTerminal.style.color = "#a855f7";
  }
}, 3500);

// --- Leaflet Geospatial Map (Focused on India) ---
let mapInitialized = false;
function initMap() {
  // Center roughly on central India 
  const map = L.map('leafletMap').setView([22.5937, 78.9629], 5);
  
  // Use a dark theme map tile
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Drop 15 fake disease clusters across India
  for(let i=0; i<15; i++) {
    const lat = 10 + (Math.random() * 20); // Indian Latitudes
    const lng = 70 + (Math.random() * 20); // Indian Longitudes
    const d = diseases[Math.floor(Math.random() * diseases.length)];
    
    // Make red pulsing circle markers
    L.circleMarker([lat, lng], {
      color: '#ef4444', radius: 8, weight: 2, fillOpacity: 0.6
    }).addTo(map).bindPopup(`<b>High Alert</b><br>Concentration of ${d} detected.`);
  }
  mapInitialized = true;
}