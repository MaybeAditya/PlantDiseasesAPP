// script.js
const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("dropArea");
const uploadCard = document.getElementById("uploadCard");
const previewArea = document.getElementById("previewArea");
const previewImage = document.getElementById("previewImage");
const previewSection = document.getElementById("previewArea");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const skeleton = document.getElementById("skeleton");
const resultCard = document.getElementById("resultCard");
const predictionEl = document.getElementById("prediction");
const confidenceEl = document.getElementById("confidence");
const healthEl = document.getElementById("health");
const severityEl = document.getElementById("severity");
const summaryEl = document.getElementById("summary");
const recsEl = document.getElementById("recs");
const barFill = document.getElementById("barFill");
const hud = document.getElementById("hud");
const procFeed = document.getElementById("procFeed");
const themeToggle = document.getElementById("themeToggle");

let currentFile = null;

function setDarkMode(on){
  document.documentElement.classList.toggle("dark", on);
  themeToggle.checked = on;
}
setDarkMode(true); // default cinematic

// Drag & drop events
["dragenter","dragover"].forEach(evt => {
  dropArea.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    uploadCard.classList.add("drag-active");
  });
});
["dragleave","drop"].forEach(evt => {
  dropArea.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    uploadCard.classList.remove("drag-active");
  });
});
dropArea.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files?.[0];
  handleFile(f);
});
dropArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => handleFile(e.target.files?.[0]));

function handleFile(f){
  if(!f) return;
  if(!f.type.startsWith("image/")){
    alert("Please upload an image file");
    return;
  }
  currentFile = f;
  previewImage.src = URL.createObjectURL(f);
  previewSection.classList.remove("hidden");
  document.getElementById("previewArea").classList.remove("hidden");
  // hide old results
  resultCard.classList.add("hidden");
}

function showSkeleton(on){
  skeleton.classList.toggle("hidden", !on);
  hud.classList.toggle("visible", on);
}

function fillProcFeed(){
  procFeed.innerHTML = `0x${Math.floor(Math.random()*1e8).toString(16)} &nbsp; edges:${Math.floor(Math.random()*160)}`;
}

themeToggle.addEventListener("change", (e) => setDarkMode(e.target.checked));

clearBtn.addEventListener("click", () => {
  currentFile = null;
  previewImage.src = "";
  resultCard.classList.add("hidden");
  previewSection.classList.add("hidden");
});

// analyze: convert file to base64 and send to /api/predict
analyzeBtn.addEventListener("click", async () => {
  if(!currentFile){
    alert("Upload a leaf image first");
    return;
  }

  // show HUD + skeleton
  showSkeleton(true);
  fillProcFeed();

  // read file as base64
  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];

    // POST to serverless endpoint
    try {
      const resp = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 })
      });

      const data = await resp.json();

      // show result (mock or real)
      const conf = Number(data.confidence) || Math.round(60 + Math.random()*30);
      const pred = data.prediction || (conf > 80 ? "Early Blight" : "Healthy");
      const summary = data.summary || (pred === "Healthy" ? "Leaf appears healthy." : "Typical symptoms observed on leaf.");
      const recs = data.recommendations || (pred === "Healthy" ? ["Continue monitoring","Optimal watering","No action needed"] : ["Remove infected leaves","Apply fungicide","Improve drainage"]);

      // animate result
      predictionEl.textContent = pred;
      confidenceEl.textContent = `Confidence: ${conf}%`;
      healthEl.textContent = Math.max(0, 100 - Math.round(conf));
      severityEl.textContent = conf > 85 ? "High" : conf > 60 ? "Moderate" : "Low";
      summaryEl.textContent = summary;
      recsEl.innerHTML = recs.map(r => `<li>${r}</li>`).join("");
      barFill.style.width = `${conf}%`;

      // hide skeleton/HUD and display card
      showSkeleton(false);
      resultCard.classList.remove("hidden");
    } catch (err){
      console.error(err);
      alert("Server error or network issue. See console.");
      showSkeleton(false);
    }
  };

  reader.onerror = () => { alert("Error reading file"); showSkeleton(false); };
  reader.readAsDataURL(currentFile);
});