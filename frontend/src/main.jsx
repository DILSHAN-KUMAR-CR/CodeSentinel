import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import {
  AlertTriangle,
  Bug,
  GitPullRequest,
  Github,
  Search,
  ShieldCheck,
} from "lucide-react"
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

function StatCard({ label, value, danger }) {
  return (
    <div className={`stat-card ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FindingCard({ finding }) {
  const severityClass = finding.severity.toLowerCase()

  return (
    <div className="finding-card">
      <div className="finding-header">
        <div>
          <div className={`severity ${severityClass}`}>
            {finding.severity}
          </div>
          <h3>{finding.vulnerability}</h3>
        </div>
        <span className="cwe">{finding.cwe || "N/A"}</span>
      </div>

      <div className="finding-meta">
        Line {finding.line} · {finding.category}
      </div>

      <div className="code-block">
        <code>{finding.code}</code>
      </div>

      <div className="finding-section">
        <h4>Scanner Analysis</h4>
        <p>{finding.description}</p>
      </div>

      <div className="finding-section">
        <h4>Recommended Fix</h4>
        <p>{finding.recommendation}</p>
      </div>

      {finding.ai_analysis && (
        <div className="ai-box">
          <div className="ai-title">
            <ShieldCheck size={18} />
            AI Security Analysis
          </div>

          <div className="finding-section">
            <h4>Why is this vulnerable?</h4>
            <p>{finding.ai_analysis.explanation}</p>
          </div>

          <div className="finding-section">
            <h4>Attack Impact</h4>
            <p>{finding.ai_analysis.attack_impact}</p>
          </div>

          <div className="finding-section">
            <h4>Secure Fix</h4>
            <p>{finding.ai_analysis.secure_fix}</p>
          </div>

          {finding.ai_analysis.fixed_code && (
            <div className="finding-section">
              <h4>AI-Generated Fixed Code</h4>
              <div className="code-block">
                <code>{finding.ai_analysis.fixed_code}</code>
              </div>
            </div>
          )}

          <div className="finding-section">
            <h4>Developer Tip</h4>
            <p>{finding.ai_analysis.developer_tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function FindingList({ files }) {
  return (
    <div className="findings">
      {files.map((file) =>
        file.findings.map((finding) => (
          <div key={`${file.path}-${finding.id}`}>
            <div className="file-path-heading">
              {file.path}
            </div>
            <FindingCard finding={finding} />
          </div>
        ))
      )}
    </div>
  )
}

function App() {
  const [mode, setMode] = useState("code")
  const [code, setCode] = useState(sample)
  const [language, setLanguage] = useState("python")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [pullRequestUrl, setPullRequestUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  function switchMode(nextMode) {
    setMode(nextMode)
    setResult(null)
    setError("")
  }

  async function scanCode() {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/scan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            language,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Code scan failed."
        )
      }

      setResult({
        type: "code",
        data,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function scanRepository() {
    if (!repositoryUrl.trim()) {
      setError("Enter a GitHub repository URL.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/scan/github",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repository_url: repositoryUrl,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "GitHub scan failed."
        )
      }

      setResult({
        type: "github",
        data,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function scanPullRequest() {
    if (!pullRequestUrl.trim()) {
      setError("Enter a GitHub Pull Request URL.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/scan/github/pr",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pull_request_url: pullRequestUrl,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Pull Request scan failed."
        )
      }

      setResult({
        type: "pull-request",
        data,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const codeData =
    result?.type === "code"
      ? result.data
      : null

  const githubData =
    result?.type === "github"
      ? result.data
      : null

  const pullRequestData =
    result?.type === "pull-request"
      ? result.data
      : null

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h1>CodeSentinel</h1>
            <span>AI-Powered Code Security</span>
          </div>
        </div>

        <div className="status">
          <span className="status-dot" />
          Security Engine Online
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <ShieldCheck size={16} />
              SECURE SOFTWARE DEVELOPMENT
            </div>

            <h2>
              Find vulnerabilities before
              <span> attackers do.</span>
            </h2>

            <p>
              Scan source code, GitHub repositories,
              or Pull Requests and get AI-powered
              security analysis and fixes.
            </p>
          </div>
        </section>

        <div className="mode-switch">
          <button
            className={mode === "code" ? "active" : ""}
            onClick={() => switchMode("code")}
          >
            <Search size={18} />
            Code Scanner
          </button>

          <button
            className={mode === "github" ? "active" : ""}
            onClick={() => switchMode("github")}
          >
            <Github size={18} />
            GitHub Scanner
          </button>

          <button
            className={
              mode === "pull-request"
                ? "active"
                : ""
            }
            onClick={() =>
              switchMode("pull-request")
            }
          >
            <GitPullRequest size={18} />
            Pull Request
          </button>
        </div>

        {mode === "code" && (
          <section className="scanner-panel">
            <div className="panel-header">
              <div>
                <span className="label">
                  SOURCE CODE
                </span>

                <h3>Paste code to scan</h3>
              </div>

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
              >
                <option value="python">
                  Python
                </option>
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) =>
                setCode(e.target.value)
              }
              spellCheck="false"
            />

            <button
              className="primary-button"
              onClick={scanCode}
              disabled={loading}
            >
              <Search size={18} />

              {loading
                ? "Scanning..."
                : "Scan Code"}
            </button>
          </section>
        )}

        {mode === "github" && (
          <section className="scanner-panel github-panel">
            <div className="github-heading">
              <div className="github-icon">
                <Github size={30} />
              </div>

              <div>
                <span className="label">
                  GITHUB REPOSITORY
                </span>

                <h3>
                  Scan an entire repository
                </h3>

                <p>
                  Analyze public Python repositories
                  for security vulnerabilities.
                </p>
              </div>
            </div>

            <label>Repository URL</label>

            <div className="github-input">
              <Github size={20} />

              <input
                value={repositoryUrl}
                onChange={(e) =>
                  setRepositoryUrl(e.target.value)
                }
                placeholder="https://github.com/owner/repository"
              />
            </div>

            <button
              className="primary-button"
              onClick={scanRepository}
              disabled={loading}
            >
              <ShieldCheck size={18} />

              {loading
                ? "Scanning Repository..."
                : "Scan Repository"}
            </button>
          </section>
        )}

        {mode === "pull-request" && (
          <section className="scanner-panel github-panel">
            <div className="github-heading">
              <div className="github-icon">
                <GitPullRequest size={30} />
              </div>

              <div>
                <span className="label">
                  GITHUB PULL REQUEST
                </span>

                <h3>
                  Scan code before it is merged
                </h3>

                <p>
                  Analyze changed Python files in a
                  public GitHub Pull Request.
                </p>
              </div>
            </div>

            <label>
              Pull Request URL
            </label>

            <div className="github-input">
              <GitPullRequest size={20} />

              <input
                value={pullRequestUrl}
                onChange={(e) =>
                  setPullRequestUrl(e.target.value)
                }
                placeholder="https://github.com/owner/repository/pull/1"
              />
            </div>

            <button
              className="primary-button"
              onClick={scanPullRequest}
              disabled={loading}
            >
              <ShieldCheck size={18} />

              {loading
                ? "Scanning Pull Request..."
                : "Scan Pull Request"}
            </button>
          </section>
        )}

        {error && (
          <div className="error-box">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {codeData && (
          <section className="results">
            <div className="results-header">
              <div>
                <span className="label">
                  SCAN RESULTS
                </span>

                <h2>Security Report</h2>
              </div>

              <div className="score">
                <strong>
                  {codeData.score}
                </strong>

                <span>/100</span>

                <small>
                  Security Score
                </small>
              </div>
            </div>

            <div className="stats">
              <StatCard
                label="Critical"
                value={codeData.summary.critical}
                danger
              />

              <StatCard
                label="High"
                value={codeData.summary.high}
                danger
              />

              <StatCard
                label="Medium"
                value={codeData.summary.medium}
              />

              <StatCard
                label="Low"
                value={codeData.summary.low}
              />

              <StatCard
                label="Total"
                value={codeData.summary.total}
              />
            </div>

            {codeData.ai_enabled && (
              <div className="ai-status">
                <ShieldCheck size={17} />
                AI analysis enabled
              </div>
            )}

            <div className="findings">
              {codeData.findings.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck size={42} />

                  <h3>
                    No vulnerabilities found
                  </h3>

                  <p>
                    CodeSentinel did not detect any
                    supported security issues.
                  </p>
                </div>
              ) : (
                codeData.findings.map(
                  (finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                    />
                  )
                )
              )}
            </div>
          </section>
        )}

        {githubData && (
          <section className="results">
            <div className="results-header">
              <div>
                <span className="label">
                  GITHUB SCAN RESULTS
                </span>

                <h2>
                  {githubData.owner}/
                  {githubData.repository}
                </h2>

                <p>
                  {githubData.files_scanned} Python
                  files scanned
                </p>
              </div>

              <div className="repo-score">
                <strong>
                  {githubData.total_findings === 0
                    ? 100
                    : 0}
                </strong>

                <span>/100</span>

                <small>
                  Repository Score
                </small>
              </div>
            </div>

            <div className="stats">
              <StatCard
                label="Critical"
                value={githubData.critical}
                danger
              />

              <StatCard
                label="High"
                value={githubData.high}
                danger
              />

              <StatCard
                label="Medium"
                value={githubData.medium}
              />

              <StatCard
                label="Low"
                value={githubData.low}
              />

              <StatCard
                label="Total"
                value={githubData.total_findings}
              />
            </div>

            <div className="repository-files">
              {githubData.files.map((file) => (
                <div
                  className="repository-file"
                  key={file.path}
                >
                  <div className="file-info">
                    <div className="file-icon">
                      {file.findings.length > 0 ? (
                        <Bug size={18} />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                    </div>

                    <div>
                      <h3>{file.path}</h3>

                      <span>
                        {file.findings.length === 0
                          ? "No vulnerabilities detected"
                          : `${file.findings.length} finding${
                              file.findings.length >
                              1
                                ? "s"
                                : ""
                            }`}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`file-score ${
                      file.score < 70
                        ? "bad"
                        : file.score < 90
                        ? "warning"
                        : "good"
                    }`}
                  >
                    {file.score}/100
                  </div>
                </div>
              ))}
            </div>

            {githubData.total_findings > 0 && (
              <FindingList
                files={githubData.files}
              />
            )}

            {githubData.total_findings === 0 && (
              <div className="empty-state">
                <ShieldCheck size={42} />

                <h3>
                  Repository looks secure
                </h3>

                <p>
                  No supported security
                  vulnerabilities were detected
                  in the scanned files.
                </p>
              </div>
            )}
          </section>
        )}

        {pullRequestData && (
          <section className="results">
            <div className="results-header">
              <div>
                <span className="label">
                  PULL REQUEST SECURITY RESULTS
                </span>

                <h2>
                  #{pullRequestData.pull_number}{" "}
                  {pullRequestData.title}
                </h2>

                <p>
                  {pullRequestData.owner}/
                  {pullRequestData.repository}
                </p>

                <div className="pr-state">
                  {pullRequestData.state}
                </div>
              </div>

              <div className="repo-score">
                <strong>
                  {pullRequestData.total_findings ===
                  0
                    ? 100
                    : 0}
                </strong>

                <span>/100</span>

                <small>
                  PR Security Score
                </small>
              </div>
            </div>

            <div className="stats">
              <StatCard
                label="Critical"
                value={pullRequestData.critical}
                danger
              />

              <StatCard
                label="High"
                value={pullRequestData.high}
                danger
              />

              <StatCard
                label="Medium"
                value={pullRequestData.medium}
              />

              <StatCard
                label="Low"
                value={pullRequestData.low}
              />

              <StatCard
                label="Total"
                value={
                  pullRequestData.total_findings
                }
              />
            </div>

            <div className="pr-summary">
              <GitPullRequest size={20} />

              <div>
                <strong>
                  {pullRequestData.files_scanned}{" "}
                  changed Python files scanned
                </strong>

                <span>
                  Security analysis completed for
                  this Pull Request.
                </span>
              </div>
            </div>

            <div className="repository-files">
              {pullRequestData.files.map(
                (file) => (
                  <div
                    className="repository-file"
                    key={file.path}
                  >
                    <div className="file-info">
                      <div className="file-icon">
                        {file.findings.length > 0 ? (
                          <Bug size={18} />
                        ) : (
                          <ShieldCheck size={18} />
                        )}
                      </div>

                      <div>
                        <h3>{file.path}</h3>

                        <span>
                          {file.findings.length ===
                          0
                            ? "No vulnerabilities detected"
                            : `${file.findings.length} finding${
                                file.findings.length >
                                1
                                  ? "s"
                                  : ""
                              }`}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`file-score ${
                        file.score < 70
                          ? "bad"
                          : file.score < 90
                          ? "warning"
                          : "good"
                      }`}
                    >
                      {file.score}/100
                    </div>
                  </div>
                )
              )}
            </div>

            {pullRequestData.total_findings > 0 && (
              <FindingList
                files={pullRequestData.files}
              />
            )}

            {pullRequestData.total_findings === 0 && (
              <div className="empty-state">
                <ShieldCheck size={42} />

                <h3>
                  Pull Request looks secure
                </h3>

                <p>
                  No supported security
                  vulnerabilities were detected
                  in the changed Python files.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

createRoot(
  document.getElementById("root")
).render(<App />)