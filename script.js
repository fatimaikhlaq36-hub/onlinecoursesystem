const form = document.getElementById("enrollmentForm");

form.addEventListener("submit", function(e){
    e.preventDefault();

    const studentName = document.getElementById("studentName").value;
    const courseName = document.getElementById("courseName").value;

    fetch("http://localhost:3000/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, courseName })
    })
    .then(response => response.text())
    .then(data => {
        if (data === "Enrollment Successful") {
            document.getElementById("successMsg").style.display = "block";
            form.reset();
        } else {
            alert("Enrollment failed: " + data);
        }
    })
    .catch(error => {
        console.log(error);
        alert("Connection error. Is the server running?");
    });
});