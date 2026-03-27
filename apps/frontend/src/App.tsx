import { useState } from 'react'
import './App.css'

function App() {
  const students = ["Student A", "Student B", "Student C"]

  const cases = [
    { name: "Gregory House" },
    { name: "Case #2" }
  ]

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      
      {/* Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>EMR-PA</h2>
        <h3>Home</h3>
      </div>

      {/* Welcome */}
      <h1>Welcome, Faculty Member!</h1>

      {/* Students Section */}
      <div style={{ marginTop: "30px" }}>
        <h2>Students</h2>
        {students.map((student, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            {student}
            <button style={{ marginLeft: "10px" }}>
              Open Student View
            </button>
          </div>
        ))}
      </div>

      {/* Cases Section */}
      <div style={{ marginTop: "30px" }}>
        <h2>Cases</h2>
        <button style={{ marginBottom: "10px" }}>+ Create New</button>

        {cases.map((c, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <strong>{c.name}</strong>
            <div>
              <button>View Case</button>
              <button>Edit Case</button>
              <button>Assign Case</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default App