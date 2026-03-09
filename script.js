const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const dropArea = document.getElementById("dropArea");
const resultDiv = document.getElementById("result");

// New elements for Modal and Theme
const errorModal = document.getElementById("errorModal");
const closeModalBtn = document.getElementById("closeModal");
const themeToggle = document.getElementById("themeToggle");

// --- Theme Toggle Logic ---
themeToggle.onclick = () => {
  const currentTheme = document.body.getAttribute("data-theme");
  if (currentTheme === "light") {
    document.body.removeAttribute("data-theme");
    themeToggle.innerText = "☀️ Light Mode";
  } else {
    document.body.setAttribute("data-theme", "light");
    themeToggle.innerText = "🌙 Dark Mode";
  }
};

// --- Modal Logic ---
closeModalBtn.onclick = () => {
  errorModal.classList.add("hidden");
};

function showErrorModal() {
  errorModal.classList.remove("hidden");
}

// --- Upload Logic ---
dropArea.onclick = () => fileInput.click();

let file;

fileInput.onchange = e => {
  file = e.target.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    resultDiv.classList.add("hidden");
  }
};

analyzeBtn.onclick = async () => {
  if (!file) {
    // Keep a mild alert just for empty uploads, or you can make a second modal for this!
    alert("Please upload an image first."); 
    return;
  }

  analyzeBtn.innerText = "Analyzing...";
  analyzeBtn.disabled = true;

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
        // Log the actual error silently for your own debugging
        const errorData = await res.json();
        console.error("Silent Backend Log:", errorData);
        
        // Show the beautiful, generic modal to the user instead of the ugly alert
        showErrorModal();
        return;
      }

      const data = await res.json();
      showResult(data);

    } catch (error) {
      console.error("Network error:", error);
      showErrorModal(); // Show modal on network drops too
    } finally {
      analyzeBtn.innerText = "Run Analysis";
      analyzeBtn.disabled = false;
    }
  };

  reader.readAsDataURL(file);
};

clearBtn.onclick = () => {
  file = null;
  fileInput.value = "";
  preview.src = "";
  preview.style.display = "none";
  resultDiv.classList.add("hidden");
};

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
}

function getSeverity(c) {
  if (!c) return "Unknown";
  if (c > 85) return "High";
  if (c > 60) return "Moderate";
  return "Low";
}