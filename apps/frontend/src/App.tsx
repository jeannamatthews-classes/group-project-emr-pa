import { useState } from 'react'
import './App.css'

function App() {
  const students = ["Student A", "Student B", "Student C"]

  const cases = [
    { name: "Gregory House" },
    { name: "Case #2" }
  ]

  return (
    <div className="container">

      {/*Navigation*/}
      <div className="navbar" style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h2 className="logo">EMR-PA</h2>
        <h2 className="nav-link">Home</h2>
      </div>

      {/*Welcome*/}
      <h1 className="welcome">Welcome, Faculty Member!</h1>

      {/*Students*/}
      <div className="card">
        <h2>Students</h2>
        {students.map((student, index) => (
          <div key={index} className="row">
            <span>{student}</span>
            <button className="primary-btn">Open</button>
          </div>
        ))}
      </div>

      {/*Cases*/}
      <div className="card">
        <div className="card-healer">
          <h2>Cases</h2>
          <button className="primary-btn"></button>
        </div>

        {cases.map((c, index) => (
          <div key={index} className="case-item">
            <strong>{c.name}</strong>
            <div>
              <button className="secondary-btn">View</button>
              <button className="secondary-btn">Edit</button>
              <button className="secondary-btn">Assign</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default App