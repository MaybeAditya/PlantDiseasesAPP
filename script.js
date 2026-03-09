const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const dropArea = document.getElementById("dropArea");
const resultDiv = document.getElementById("result");

// Make the upload box clickable
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
    alert("Please upload an image first.");
    return;
  }

  analyzeBtn.innerText = "Analyzing...";
  analyzeBtn.disabled = true;

  const reader = new FileReader();

  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    
    try {
      // Fetch from OUR backend, not Gemini
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });

      if (!res.ok) {
        // Parse the JSON error from the backend
        const errorData = await res.json();
        console.error("Server crashed:", errorData);
        alert(`Backend error: ${errorData.details}`);
        return;
      }

      const data = await res.json();
      showResult(data);

    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to connect to the server.");
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