const fileInput = document.getElementById("fileInput")
const preview = document.getElementById("preview")
const analyzeBtn = document.getElementById("analyzeBtn")

let file

fileInput.onchange = e=>{
file = e.target.files[0]
preview.src = URL.createObjectURL(file)
}

analyzeBtn.onclick = async ()=>{

if(!file){
alert("upload image")
return
}

const reader = new FileReader()

reader.onload = async ()=>{

const base64 = reader.result.split(",")[1]
const res = await fetch("/api/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image: base64 })
})

// ADD THIS CHECK: If the server returns a 500, catch it before parsing JSON
if (!res.ok) {
  const errorText = await res.text()
  console.error("Server crashed:", errorText)
  alert("Backend error! Check the browser console or Vercel logs.")
  return
}

const data = await res.json()
showResult(data)

}

reader.readAsDataURL(file)

}

function showResult(data){

document.getElementById("result").classList.remove("hidden")

document.getElementById("prediction").innerText = data.prediction

document.getElementById("confidence").innerText =
"Confidence: "+data.confidence+"%"

document.getElementById("fill").style.width =
data.confidence+"%"

document.getElementById("health").innerText =
"Health Score: "+(100-data.confidence)

document.getElementById("severity").innerText =
"Severity: "+severity(data.confidence)

document.getElementById("summary").innerText =
data.summary

const list = document.getElementById("recs")
list.innerHTML=""

data.recommendations.forEach(r=>{
const li=document.createElement("li")
li.innerText=r
list.appendChild(li)
})

}

function severity(c){

if(c>85) return "High"
if(c>60) return "Moderate"
return "Low"

}