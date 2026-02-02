import React, { useState } from "react";
import axios from "axios";
import "../StyleSheets/titans.css";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";

const Titans = () => {
  let [data, setData] = useState("");
  const [queryString, setQueryString] = useState("");
  const [payload, setPayload] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [writeFields, setWriteFields] = useState({});
  const [error, setError] = useState(false);
  const handleInputChange = (event) => {
    setQueryString(event.target.value);
  };

  const handleClick = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/send-data",
        payload,
      );
      console.log("Response from server:", response.data);
      setData(response.data.receivedData);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };
  const selectorToLabel = (selector) => {
    if (!selector) return "";
    if (selector === "#email") return "Email";
    if (selector === "#pass") return "Password";
  };

  const handlePopupSubmit = () => {
    const allFieldsValid = Object.values(writeFields).every(
      (value) => value.trim() !== "",
    );
    if (!allFieldsValid) {
      setError(true);
      return;
    }
    const updatedPayload = payload.map((task) =>
      task.action === "input" || task.action === "type"
        ? { ...task, value: writeFields[task.selector] }
        : task,
    );
    setPayload(updatedPayload);
    setIsPopupOpen(false);
    setError(false);
  };

  const handlePopupInputChange = (selector, value) => {
    setWriteFields((prevFields) => ({
      ...prevFields,
      [selector]: value,
    }));
    setError(false);
  };

  const generateQuery = async () => {
    const data = { query: queryString };
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:9000/generate_response', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      const backendPayload = result.payload || [];
      setPayload(backendPayload);
      const inputTasks = backendPayload.filter(
        (task) => task.action === "input" || task.action === "type",
      );
      if (inputTasks.length > 0) {
        const initialFields = {};
        inputTasks.forEach((task) => {
          initialFields[task.selector] = "";
        });
        setWriteFields(initialFields);
        setIsPopupOpen(true);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <nav className="navbar navbar-light topMenuWrap fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            LLM-powered Auto-Browsing Copilot
          </a>
        </div>
      </nav>

      <div className="mainBody">
        <div className="container-fluid">
          <div className="row">
            <div className="displayArea">
              <div className="fullChatwrap">
                <h3>Please add text</h3>
                <div className="chatWrap">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your query"
                    value={queryString}
                    onChange={handleInputChange}
                  />
                  <div className="row">
                    <div className="col-md-6"></div>
                    <div className="col-md-6">
                      <button
                        disabled={!queryString.trim()}
                        onClick={generateQuery}
                        className="btn"
                      >
                        Query
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {loading && (
                <div className="fullChatwrap">
                  <h3>Generating Payload........... Please Wait!!</h3>
                </div>
              )}
              {!loading && payload.length>0 && (
                <div className="fullChatwrap">
                  <h3>Json Payload</h3>
                  <div className="chatWrap">
                    <div className="jsonWrap">
                      <pre
                        style={{
                          backgroundColor: "#f4f4f4",
                          padding: "10px",
                          borderRadius: "5px",
                        }}
                      >
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(payload).map(([key, value]) => [
                              key,
                              {
                                ...value,
                                Content:
                                  value.Name?.toLowerCase() === "password"
                                    ? "******"
                                    : value.Content,
                              },
                            ]),
                          ),
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                    <div className="row">
                      <div className="col-md-12 genRate">
                        <button onClick={handleClick} className="btn">
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPopupOpen && (
        <div className="popup">
          <div className="popup-content">
            <h3>Enter Credentials</h3>
            {Object.keys(writeFields).map((name) => (
              <div key={name}>
                <label>{selectorToLabel(name)}</label>
                <input
                  type={
                    name.toLowerCase().includes("password")
                      ? "password"
                      : "text"
                  }
                  onChange={(e) => handlePopupInputChange(name, e.target.value)}
                />
              </div>
            ))}
            {error && (
              <p style={{ color: "red" }}>
                All fields are mandatory! Please fill it.
              </p>
            )}
            <button onClick={handlePopupSubmit} className="btn">
              Submit
            </button>
          </div>
        </div>
      )}
      <footer>
       LLM-Powered Automation • Terms & Privacy apply.
      </footer>
    </div>
  );
};

export default Titans;
