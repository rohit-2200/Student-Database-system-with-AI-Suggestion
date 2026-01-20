// Read studentId from URL
const params = new URLSearchParams(window.location.search);
const studentId = params.get("studentId");


// LOAD STUDENT DETAILS

fetch(`http://localhost:3000/student/${studentId}`)
  .then(res => res.json())
  .then(student => {
    document.getElementById("studentName").innerText = student.name;
    document.getElementById("studentRoll").innerText = student.roll_no;
    document.getElementById("studentClass").innerText = student.student_class;
  });


// LOAD MARKS

fetch(`http://localhost:3000/marks/${studentId}`)
  .then(res => res.json())
  .then(data => {
    if (!data) return;

    document.getElementById("math").value = data.math ?? "";
    document.getElementById("science").value = data.science ?? "";
    document.getElementById("english").value = data.english ?? "";

    calculateTotal();
  });


// CALCULATE TOTAL & AVERAGE

function calculateTotal() {
  const math = Number(document.getElementById("math").value) || 0;
  const science = Number(document.getElementById("science").value) || 0;
  const english = Number(document.getElementById("english").value) || 0;

  const total = math + science + english;
  const average = total / 3;

  document.getElementById("totalMarks").innerText = total;
  document.getElementById("averageMarks").innerText = average.toFixed(2);
}

// Recalculate when marks change
document.getElementById("math").addEventListener("input", calculateTotal);
document.getElementById("science").addEventListener("input", calculateTotal);
document.getElementById("english").addEventListener("input", calculateTotal);


// SAVE MARKS

function saveMarks() {
  const math = document.getElementById("math").value;
  const science = document.getElementById("science").value;
  const english = document.getElementById("english").value;

  fetch("http://localhost:3000/marks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      student_id: studentId,
      math,
      science,
      english
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
    });
}


// BACK NAVIGATION

function goBack() {
  window.location.href = "index.html";
}

async function getAISuggestions(studentId, math, science, english) {
  const outEl = document.getElementById("aiSuggestion"); // create this element in HTML
  outEl.innerText = "AI is thinking…";

  try {
    const res = await fetch("http://localhost:3000/ai-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ math, science, english })
    });
    const data = await res.json();
    outEl.innerText = data.suggestion;
  } catch (err) {
    outEl.innerText = "Unable to fetch AI suggestions.";
    console.error(err);
  }
}
