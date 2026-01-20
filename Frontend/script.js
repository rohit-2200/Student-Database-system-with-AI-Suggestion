let editingStudentId = null;

function showDB() {
  console.log("Show DB button clicked");

  fetch("http://localhost:3000/students")
    .then(res => res.json())
    .then(data => {
      console.log("Data received:", data);

      const tableBody = document.getElementById("tableBody");
      tableBody.innerHTML = "";


data.forEach(student => {
  const row = `
  <tr>
    <td>${student.id}</td>
    <td>${student.name}</td>
    <td>${student.roll_no}</td>
    <td>${student.student_class}</td>
    <td>${student.age}</td>
    <td>
    <button onclick="editStudent(${student.id}, '${student.name}', '${student.roll_no}', '${student.student_class}', ${student.age})">Edit</button>
    <button onclick="deleteStudent(${student.id})">Delete</button>
    <button onclick="viewMarks(${student.id})">View Marks</button>
   </td>

  </tr>
`;

  tableBody.innerHTML += row;
});
    })
    .catch(err => console.error("Fetch error:", err));
}


function editStudent(id, name, roll_no, student_class, age) {
  document.getElementById("name").value = name;
  document.getElementById("roll_no").value = roll_no;
  document.getElementById("student_class").value = student_class;
  document.getElementById("age").value = age;

  editingStudentId = id;
}


function addStudent() {
  const name = document.getElementById("name").value;
  const roll_no = document.getElementById("roll_no").value;
  const student_class = document.getElementById("student_class").value;
  const age = document.getElementById("age").value;

  if (!name || !roll_no || !student_class || !age) {
    alert("Please fill all fields");
    return;
  }

  // 🔁 UPDATE MODE
  if (editingStudentId !== null) {
    fetch(`http://localhost:3000/student/${editingStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        roll_no,
        student_class,
        age
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        editingStudentId = null;
        clearForm();
        showDB();
      });

    return; // VERY IMPORTANT
  }

  // ➕ CREATE MODE
  fetch("http://localhost:3000/add-student", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      roll_no,
      student_class,
      age
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      clearForm();
      showDB();
    });
}






function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  fetch(`http://localhost:3000/student/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      showDB(); // refresh table
    })
    .catch(err => console.error("Delete error:", err));
}



function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("roll_no").value = "";
  document.getElementById("student_class").value = "";
  document.getElementById("age").value = "";
}

showDB();



function viewMarks(studentId) {
  window.location.href = `marks.html?studentId=${studentId}`;
}

