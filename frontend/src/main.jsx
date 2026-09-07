import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { ShieldCheck, AlertTriangle, Bug, Search, Github } from "lucide-react"
import "./styles.css"

const sample = `from flask import Flask
import sqlite3

app = Flask(__name__)

password = "admin123"
api_key = "sk_test_123456789"

@app.route("/user")
def user(user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    return eval(user_id)

if password == "123456":
    print("login")`

function App() {
  const [code, setCode] = useState(sample)
  const [language, setLanguage] = useState("python")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const scan = async () => {
    if (!code.trim()) {
      setError("Please enter some code to scan.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Scan failed.")
      }

      setResult(data)
    } catch (e) {
      setError(e.message || "Backend is not running. Start FastAPI on port 8000.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">
            <ShieldCheck size={24} />
          </div>

          <div>
            <div className="brandName">CodeSentinel</div>
            <div className="brandSub">AI-powered code security</div>
          </div>
        </div>

        <a
          className="github"
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={18} />
          GitHub
        </a>
      </header>

      <main className="main">
        <section className="hero">
          <div className="heroContent">
            <div className="eyebrow">AI SECURITY ANALYSIS PLATFORM</div>

            <h1>
              Find vulnerabilities
              <br />
              before attackers do.
            </h1>

            <p>
              Scan your source code for security vulnerabilities and get
              AI-powered explanations, impact analysis, and secure fixes.
            </p>

            <div className="heroFeatures">
              <div className="feature">
                <ShieldCheck size={20} />
                <div>
                  <strong>Static Analysis</strong>
                  <span>Detect common security weaknesses</span>
                </div>
              </div>

              <div className="feature">
                <Bug size={20} />
                <div>
                  <strong>Vulnerability Detection</strong>
                  <span>Identify risky code patterns</span>
                </div>
              </div>

              <div className="feature">
                <Search size={20} />
                <div>
                  <strong>AI Remediation</strong>
                  <span>Understand and fix vulnerabilities</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="workspace">
          <div className="panel editorPanel">
            <div className="panelHeader">
              <div>
                <div className="panelTitle">Source Code</div>
                <div className="muted">
                  Paste code to scan for vulnerabilities
                </div>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              placeholder="Paste your source code here..."
            />

            <div className="editorFooter">
              <span>{code.split("\n").length} lines</span>

              <button
                className="scanButton"
                onClick={scan}
                disabled={loading}
              >
                <Search size={17} />
                {loading ? "Analyzing..." : "Scan Code"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}
          </div>

          <div className="panel resultsPanel">
            <div className="panelHeader">
              <div>
                <div className="panelTitle">Security Report</div>
                <div className="muted">Latest scan results</div>
              </div>

              {result && (
                <div className="scoreBadge">
                  <span>Security Score</span>
                  <strong>{result.score}</strong>
                  <small>/100</small>
                </div>
              )}
            </div>

            {!result ? (
              <div className="empty">
                <div className="emptyIcon">
                  <Bug size={32} />
                </div>

                <h3>No scan yet</h3>

                <p>
                  Run a scan to see vulnerabilities, security scores,
                  recommendations, and AI-powered fixes.
                </p>
              </div>
            ) : (
              <>
                <div className="stats">
                  <div className="stat criticalStat">
                    <span>Critical</span>
                    <strong>{result.summary.critical}</strong>
                  </div>

                  <div className="stat highStat">
                    <span>High</span>
                    <strong>{result.summary.high}</strong>
                  </div>

                  <div className="stat mediumStat">
                    <span>Medium</span>
                    <strong>{result.summary.medium}</strong>
                  </div>

                  <div className="stat lowStat">
                    <span>Low</span>
                    <strong>{result.summary.low}</strong>
                  </div>

                  <div className="stat totalStat">
                    <span>Total</span>
                    <strong>{result.summary.total}</strong>
                  </div>
                </div>

                {result.ai_enabled && (
                  <div className="aiEnabled">
                    <div className="aiStar">✦</div>
                    <div>
                      <strong>AI Analysis Enabled</strong>
                      <span>
                        CodeSentinel has generated security explanations and
                        remediation guidance for your findings.
                      </span>
                    </div>
                  </div>
                )}

                {result.ai_error && (
                  <div className="aiError">
                    AI analysis unavailable: {result.ai_error}
                  </div>
                )}

                <div className="findingsHeader">
                  <div>
                    <h2>Security Findings</h2>
                    <span>
                      {result.findings.length}{" "}
                      {result.findings.length === 1 ? "issue" : "issues"} detected
                    </span>
                  </div>
                </div>

                {result.findings.length === 0 ? (
                  <div className="safe">
                    <div className="safeIcon">
                      <ShieldCheck size={26} />
                    </div>

                    <div>
                      <strong>No vulnerabilities detected</strong>
                      <span>
                        Your submitted code passed the current security rules.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="findings">
                    {result.findings.map((finding) => (
                      <div className="finding" key={finding.id}>
                        <div className="findingTop">
                          <div>
                            <div className="findingName">
                              <AlertTriangle size={17} />
                              <strong>{finding.vulnerability}</strong>
                            </div>

                            <div className="location">
                              Line {finding.line} · {finding.category} ·{" "}
                              {finding.cwe || "Security"}
                            </div>
                          </div>

                          <span
                            className={`severity ${finding.severity.toLowerCase()}`}
                          >
                            {finding.severity}
                          </span>
                        </div>

                        <div className="codeBlock">
                          <div className="codeLabel">VULNERABLE CODE</div>
                          <pre>{finding.code}</pre>
                        </div>

                        <div className="findingContent">
                          <div className="contentBlock">
                            <div className="contentLabel">Scanner Analysis</div>
                            <p>{finding.description}</p>
                          </div>

                          <div className="contentBlock">
                            <div className="contentLabel">
                              Recommended Fix
                            </div>
                            <p>{finding.recommendation}</p>
                          </div>
                        </div>

                        {finding.ai_analysis && (
                          <div className="aiAnalysis">
                            <div className="aiHeader">
                              <div className="aiTitle">
                                <span>✦</span>
                                <strong>AI Security Analysis</strong>
                              </div>

                              <span className="aiLabel">AI POWERED</span>
                            </div>

                            <div className="aiGrid">
                              <div className="aiBlock">
                                <div className="contentLabel">
                                  Why is this vulnerable?
                                </div>
                                <p>
                                  {finding.ai_analysis.explanation}
                                </p>
                              </div>

                              <div className="aiBlock">
                                <div className="contentLabel">
                                  Attack Impact
                                </div>
                                <p>
                                  {finding.ai_analysis.attack_impact}
                                </p>
                              </div>

                              <div className="aiBlock">
                                <div className="contentLabel">
                                  Secure Fix
                                </div>
                                <p>
                                  {finding.ai_analysis.secure_fix}
                                </p>
                              </div>

                              <div className="aiBlock fixedCodeBlock">
                                <div className="contentLabel">
                                  AI-Generated Fixed Code
                                </div>

                                <pre>
                                  {finding.ai_analysis.fixed_code}
                                </pre>
                              </div>

                              <div className="aiBlock developerTip">
                                <div className="contentLabel">
                                  Developer Tip
                                </div>

                                <p>
                                  {finding.ai_analysis.developer_tip}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById("root")).render(<App />)