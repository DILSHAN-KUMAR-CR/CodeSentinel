import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  AlertTriangle,
  Bug,
  GitPullRequest,
  Github,
  History,
  Search,
  ShieldCheck,
} from "lucide-react"
import "./styles.css"

const API_BASE = "http://127.0.0.1:8000"

function App() {
  const [mode, setMode] = useState("code")
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("python")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [pullRequestUrl, setPullRequestUrl] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)

      const response = await fetch(`${API_BASE}/history`)

      if (!response.ok) {
        throw new Error("Failed to load scan history.")
      }

      const data = await response.json()

      setHistory(data.history || [])
    } catch (historyError) {
      setError(historyError.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const scanCode = async () => {
    if (!code.trim()) {
      setError("Enter source code before scanning.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
        }),
      })

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

      await loadHistory()
    } catch (scanError) {
      setError(scanError.message)
    } finally {
      setLoading(false)
    }
  }

  const scanRepository = async () => {
    if (!repositoryUrl.trim()) {
      setError("Enter a GitHub repository URL.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        `${API_BASE}/scan/github`,
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
          data.detail || "Repository scan failed."
        )
      }

      setResult({
        type: "github",
        data,
      })

      await loadHistory()
    } catch (scanError) {
      setError(scanError.message)
    } finally {
      setLoading(false)
    }
  }

  const scanPullRequest = async () => {
    if (!pullRequestUrl.trim()) {
      setError("Enter a GitHub Pull Request URL.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        `${API_BASE}/scan/github/pr`,
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

      await loadHistory()
    } catch (scanError) {
      setError(scanError.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "score-good"
    }

    if (score >= 50) {
      return "score-medium"
    }

    return "score-danger"
  }

  const formatDate = (value) => {
    if (!value) {
      return "Unknown"
    }

    return new Date(value).toLocaleString()
  }

  const formatScanType = (type) => {
    if (type === "pull_request") {
      return "Pull Request"
    }

    if (type === "repository") {
      return "Repository"
    }

    return "Code"
  }

  const renderFinding = (finding, index) => {
    const ai = finding.ai_analysis

    return (
      <div
        className="finding-card"
        key={`${finding.id}-${index}`}
      >
        <div className="finding-header">
          <div>
            <span
              className={`severity severity-${finding.severity.toLowerCase()}`}
            >
              {finding.severity}
            </span>

            <h3>{finding.vulnerability}</h3>
          </div>

          <span className="finding-line">
            Line {finding.line}
          </span>
        </div>

        <div className="finding-code">
          {finding.code}
        </div>

        <p>{finding.description}</p>

        {finding.cwe && (
          <div className="finding-meta">
            {finding.cwe}
          </div>
        )}

        <div className="recommendation">
          <strong>Recommendation</strong>
          <p>{finding.recommendation}</p>
        </div>

        {ai && (
          <div className="ai-box">
            <div className="ai-title">
              <ShieldCheck size={18} />
              AI Security Analysis
            </div>

            <div className="ai-section">
              <strong>Explanation</strong>
              <p>{ai.explanation}</p>
            </div>

            <div className="ai-section">
              <strong>Attack Impact</strong>
              <p>{ai.attack_impact}</p>
            </div>

            <div className="ai-section">
              <strong>Secure Fix</strong>
              <p>{ai.secure_fix}</p>
            </div>

            {ai.fixed_code && (
              <div className="ai-section">
                <strong>Fixed Code</strong>
                <pre>{ai.fixed_code}</pre>
              </div>
            )}

            <div className="ai-section">
              <strong>Developer Tip</strong>
              <p>{ai.developer_tip}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCodeResults = (data) => (
    <>
      <div className="result-summary">
        <div className="score-panel">
          <span>Security Score</span>
          <strong className={getScoreClass(data.score)}>
            {data.score}
          </strong>
          <small>out of 100</small>
        </div>

        <div className="metric">
          <span>Critical</span>
          <strong>{data.summary.critical}</strong>
        </div>

        <div className="metric">
          <span>High</span>
          <strong>{data.summary.high}</strong>
        </div>

        <div className="metric">
          <span>Medium</span>
          <strong>{data.summary.medium}</strong>
        </div>

        <div className="metric">
          <span>Low</span>
          <strong>{data.summary.low}</strong>
        </div>
      </div>

      <div className="results-heading">
        <Bug size={20} />
        <span>Security Findings</span>
      </div>

      {data.findings.length === 0 ? (
        <div className="clean-result">
          <ShieldCheck size={34} />
          <h3>No vulnerabilities detected</h3>
          <p>
            The submitted code passed the current CodeSentinel
            security rules.
          </p>
        </div>
      ) : (
        <div className="findings-list">
          {data.findings.map(renderFinding)}
        </div>
      )}
    </>
  )

  const renderRepositoryResults = (data) => (
    <>
      <div className="github-result-header">
        <div>
          <span className="eyebrow">
            GITHUB REPOSITORY RESULTS
          </span>

          <h2>
            {data.owner}/{data.repository}
          </h2>
        </div>

        <Github size={30} />
      </div>

      <div className="result-summary">
        <div className="metric">
          <span>Files Scanned</span>
          <strong>{data.files_scanned}</strong>
        </div>

        <div className="metric">
          <span>Total Findings</span>
          <strong>{data.total_findings}</strong>
        </div>

        <div className="metric">
          <span>Critical</span>
          <strong>{data.critical}</strong>
        </div>

        <div className="metric">
          <span>High</span>
          <strong>{data.high}</strong>
        </div>

        <div className="metric">
          <span>Medium</span>
          <strong>{data.medium}</strong>
        </div>

        <div className="metric">
          <span>Low</span>
          <strong>{data.low}</strong>
        </div>
      </div>

      <div className="results-heading">
        <Search size={20} />
        <span>Scanned Files</span>
      </div>

      <div className="repository-files">
        {data.files.map((file) => (
          <div
            className="repository-file"
            key={file.path}
          >
            <div className="repository-file-header">
              <strong>{file.path}</strong>

              <span
                className={getScoreClass(file.score)}
              >
                {file.score}/100
              </span>
            </div>

            {file.error ? (
              <p className="error-text">
                {file.error}
              </p>
            ) : file.findings.length === 0 ? (
              <p className="clean-file">
                No vulnerabilities detected.
              </p>
            ) : (
              <div className="findings-list">
                {file.findings.map(renderFinding)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )

  const renderPullRequestResults = (data) => (
    <>
      <div className="github-result-header">
        <div>
          <span className="eyebrow">
            PULL REQUEST SECURITY RESULTS
          </span>

          <h2>
            #{data.pull_number} {data.title}
          </h2>

          <p>
            {data.owner}/{data.repository}
          </p>
        </div>

        <GitPullRequest size={30} />
      </div>

      <div
        className={`pr-state ${
          data.security_gate_passed
            ? "pr-state-passed"
            : "pr-state-failed"
        }`}
      >
        <ShieldCheck size={20} />

        <div>
          <strong>
            Security Gate {data.security_gate}
          </strong>

          <span>
            {data.security_gate_passed
              ? "No critical or high severity vulnerabilities detected."
              : "Critical or high severity vulnerabilities detected."}
          </span>
        </div>
      </div>

      <div className="result-summary">
        <div className="score-panel">
          <span>PR Security Score</span>
          <strong
            className={getScoreClass(
              Math.min(
                ...data.files.map(
                  (file) => file.score
                ),
                100
              )
            )}
          >
            {Math.min(
              ...data.files.map(
                (file) => file.score
              ),
              100
            )}
          </strong>
          <small>out of 100</small>
        </div>

        <div className="metric">
          <span>Files Scanned</span>
          <strong>{data.files_scanned}</strong>
        </div>

        <div className="metric">
          <span>Critical</span>
          <strong>{data.critical}</strong>
        </div>

        <div className="metric">
          <span>High</span>
          <strong>{data.high}</strong>
        </div>

        <div className="metric">
          <span>Medium</span>
          <strong>{data.medium}</strong>
        </div>

        <div className="metric">
          <span>Low</span>
          <strong>{data.low}</strong>
        </div>

        <div className="metric">
          <span>Total</span>
          <strong>{data.total_findings}</strong>
        </div>
      </div>

      <div className="pr-summary">
        <GitPullRequest size={18} />

        <span>
          Security analysis completed for this Pull Request.
        </span>
      </div>

      <div className="results-heading">
        <Search size={20} />
        <span>Changed Files</span>
      </div>

      <div className="repository-files">
        {data.files.map((file) => (
          <div
            className="repository-file"
            key={file.path}
          >
            <div className="repository-file-header">
              <strong>{file.path}</strong>

              <span
                className={getScoreClass(file.score)}
              >
                {file.score}/100
              </span>
            </div>

            {file.error ? (
              <p className="error-text">
                {file.error}
              </p>
            ) : file.findings.length === 0 ? (
              <p className="clean-file">
                No vulnerabilities detected.
              </p>
            ) : (
              <div className="findings-list">
                {file.findings.map(renderFinding)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <div className="brand-name">
              CodeSentinel
            </div>

            <div className="brand-subtitle">
              AI-powered code security
            </div>
          </div>
        </div>

        <div className="status-indicator">
          <span />
          Security Engine Online
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <span className="eyebrow">
            SECURITY ANALYSIS PLATFORM
          </span>

          <h1>
            Find vulnerabilities before
            <span> attackers do.</span>
          </h1>

          <p>
            Analyze source code, GitHub repositories, and Pull
            Requests with static analysis and AI-powered security
            intelligence.
          </p>
        </section>

        <section className="scanner-card">
          <div className="mode-switch">
            <button
              className={
                mode === "code"
                  ? "mode-button active"
                  : "mode-button"
              }
              onClick={() => {
                setMode("code")
                setResult(null)
                setError("")
              }}
            >
              <Search size={17} />
              Code
            </button>

            <button
              className={
                mode === "github"
                  ? "mode-button active"
                  : "mode-button"
              }
              onClick={() => {
                setMode("github")
                setResult(null)
                setError("")
              }}
            >
              <Github size={17} />
              GitHub Repository
            </button>

            <button
              className={
                mode === "pull-request"
                  ? "mode-button active"
                  : "mode-button"
              }
              onClick={() => {
                setMode("pull-request")
                setResult(null)
                setError("")
              }}
            >
              <GitPullRequest size={17} />
              Pull Request
            </button>
          </div>

          {mode === "code" && (
            <>
              <div className="input-toolbar">
                <label htmlFor="language">
                  Language
                </label>

                <select
                  id="language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                >
                  <option value="python">
                    Python
                  </option>
                </select>
              </div>

              <textarea
                className="code-editor"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
                placeholder="Paste your source code here..."
                spellCheck="false"
              />

              <button
                className="scan-button"
                onClick={scanCode}
                disabled={loading}
              >
                <ShieldCheck size={18} />

                {loading
                  ? "Scanning..."
                  : "Scan Code"}
              </button>
            </>
          )}

          {mode === "github" && (
            <div className="github-panel">
              <Github size={36} />

              <div>
                <span className="eyebrow">
                  GITHUB REPOSITORY
                </span>

                <h2>
                  Scan a public repository
                </h2>

                <p>
                  Analyze Python files in a public GitHub
                  repository.
                </p>
              </div>

              <input
                className="github-input"
                value={repositoryUrl}
                onChange={(event) =>
                  setRepositoryUrl(event.target.value)
                }
                placeholder="https://github.com/owner/repository"
              />

              <button
                className="scan-button"
                onClick={scanRepository}
                disabled={loading}
              >
                <Github size={18} />

                {loading
                  ? "Scanning Repository..."
                  : "Scan Repository"}
              </button>
            </div>
          )}

          {mode === "pull-request" && (
            <div className="github-panel">
              <GitPullRequest size={36} />

              <div>
                <span className="eyebrow">
                  GITHUB PULL REQUEST
                </span>

                <h2>
                  Scan code before it is merged
                </h2>

                <p>
                  Analyze changed Python files in a public
                  GitHub Pull Request.
                </p>
              </div>

              <input
                className="github-input"
                value={pullRequestUrl}
                onChange={(event) =>
                  setPullRequestUrl(event.target.value)
                }
                placeholder="https://github.com/owner/repository/pull/1"
              />

              <button
                className="scan-button"
                onClick={scanPullRequest}
                disabled={loading}
              >
                <GitPullRequest size={18} />

                {loading
                  ? "Scanning Pull Request..."
                  : "Scan Pull Request"}
              </button>
            </div>
          )}
        </section>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {result && (
          <section className="results-section">
            {result.type === "code" &&
              renderCodeResults(result.data)}

            {result.type === "github" &&
              renderRepositoryResults(result.data)}

            {result.type === "pull-request" &&
              renderPullRequestResults(result.data)}
          </section>
        )}

        <section className="history-section">
          <div className="history-header">
            <div>
              <span className="eyebrow">
                SECURITY ACTIVITY
              </span>

              <h2>
                <History size={22} />
                Scan History
              </h2>
            </div>

            <button
              className="history-refresh"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {historyLoading && history.length === 0 ? (
            <div className="history-empty">
              Loading scan history...
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <History size={32} />
              <h3>No scans yet</h3>
              <p>
                Completed scans will appear here.
              </p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Repository</th>
                    <th>Score</th>
                    <th>Critical</th>
                    <th>High</th>
                    <th>Medium</th>
                    <th>Low</th>
                    <th>Findings</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="history-type">
                          {formatScanType(
                            item.scan_type
                          )}
                        </span>
                      </td>

                      <td>
                        {item.repository || "Local code"}
                      </td>

                      <td>
                        <strong
                          className={getScoreClass(
                            item.score
                          )}
                        >
                          {item.score}
                        </strong>
                      </td>

                      <td className="severity-cell">
                        {item.critical}
                      </td>

                      <td className="severity-cell">
                        {item.high}
                      </td>

                      <td className="severity-cell">
                        {item.medium}
                      </td>

                      <td className="severity-cell">
                        {item.low}
                      </td>

                      <td>
                        {item.total_findings}
                      </td>

                      <td>
                        {formatDate(
                          item.created_at
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

createRoot(
  document.getElementById("root")
).render(
  <App />
)