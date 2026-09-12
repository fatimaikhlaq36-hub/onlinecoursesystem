const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    user: "sa",
    password: "12345",
    server: "localhost",
    database: "onlinelearningsystem",
    port: 1433,
    options: { trustServerCertificate: true }
};

sql.connect(config)
.then(() => console.log("Database Connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
    res.send("Server Running Successfully");
});

// ENROLL — finds or creates student, then enrolls
app.post("/enroll", async (req, res) => {
    const { studentName, courseName } = req.body;
    try {
        // Get or create student
        let studentResult = await sql.query`
            SELECT StudentID FROM Students WHERE StudentName = ${studentName}
        `;
        let studentID;
        if (studentResult.recordset.length === 0) {
            let inserted = await sql.query`
                INSERT INTO Students (StudentName)
                OUTPUT INSERTED.StudentID
                VALUES (${studentName})
            `;
            studentID = inserted.recordset[0].StudentID;
        } else {
            studentID = studentResult.recordset[0].StudentID;
        }

        // Get course ID
        let courseResult = await sql.query`
            SELECT CourseID FROM Courses WHERE CourseName = ${courseName}
        `;
        if (courseResult.recordset.length === 0) {
            return res.send("Course not found");
        }
        let courseID = courseResult.recordset[0].CourseID;

        // Check if already enrolled
        let existing = await sql.query`
            SELECT * FROM Enrollments
            WHERE StudentID = ${studentID} AND CourseID = ${courseID}
        `;
        if (existing.recordset.length > 0) {
            return res.send("Already enrolled in this course");
        }

        // Insert enrollment
        await sql.query`
            INSERT INTO Enrollments (StudentID, CourseID, EnrollmentDate)
            VALUES (${studentID}, ${courseID}, GETDATE())
        `;

        // Insert progress
        await sql.query`
            INSERT INTO Progress (StudentID, CourseID, ProgressPercentage)
            VALUES (${studentID}, ${courseID}, 0)
        `;

        res.send("Enrollment Successful");
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// GET all enrollments with student and course names
app.get("/students", async (req, res) => {
    try {
        const result = await sql.query`
            SELECT e.EnrollmentID, s.StudentName, c.CourseName, e.EnrollmentDate
            FROM Enrollments e
            JOIN Students s ON e.StudentID = s.StudentID
            JOIN Courses c ON e.CourseID = c.CourseID
        `;
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// GET all instructors
app.get("/instructors", async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Instructors`;
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// ADD instructor
app.post("/addInstructor", async (req, res) => {
    const { name, subject } = req.body;
    try {
        await sql.query`
            INSERT INTO Instructors (InstructorName, Specialization)
            VALUES (${name}, ${subject})
        `;
        res.send("Instructor Added");
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// DELETE instructor
app.delete("/deleteInstructor/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM Instructors WHERE InstructorID = ${id}`;
        res.send("Instructor Deleted");
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// GET progress with student and course names
app.get("/progress", async (req, res) => {
    try {
        const result = await sql.query`
            SELECT s.StudentName, c.CourseName, p.ProgressPercentage
            FROM Progress p
            JOIN Students s ON p.StudentID = s.StudentID
            JOIN Courses c ON p.CourseID = c.CourseID
        `;
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// UPDATE progress
app.post("/updateProgress", async (req, res) => {
    const { studentName, courseName, progressPercentage } = req.body;
    try {
        await sql.query`
            UPDATE Progress
            SET ProgressPercentage = ${progressPercentage}
            WHERE StudentID = (SELECT StudentID FROM Students WHERE StudentName = ${studentName})
            AND CourseID = (SELECT CourseID FROM Courses WHERE CourseName = ${courseName})
        `;
        res.send("Progress Updated");
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// GET certificates with student and course names
app.get("/certificates", async (req, res) => {
    try {
        const result = await sql.query`
            SELECT s.StudentName, c.CourseName, cert.Status
            FROM Certificates cert
            JOIN Students s ON cert.StudentID = s.StudentID
            JOIN Courses c ON cert.CourseID = c.CourseID
        `;
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

// GET all courses with instructor name
app.get("/courses", async (req, res) => {
    try {
        const result = await sql.query`
            SELECT c.CourseID, c.CourseName, c.Description, i.InstructorName
            FROM Courses c
            LEFT JOIN Instructors i ON c.InstructorID = i.InstructorID
        `;
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

app.listen(3000, () => console.log("Server Running on Port 3000"));