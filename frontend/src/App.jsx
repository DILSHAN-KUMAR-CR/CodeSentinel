import React, { useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

const sampleCode = `import sqlite3

password = "admin123"

def login(username, password):
    query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
    connection = sqlite3.connect("users.db")
    return connection.execute(query).fetchall()

result = eval(input("Enter expression: "))`

function App() {
  const [code, setCode] = useState(sampleCode)
  const [language, setLanguage] = useState('python')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const scanCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to scan.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Scan failed.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message || 'Unable to connect to the CodeSentinel backend.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityClass = (severity) => {
    return `severity-${severity.toLowerCase()}`
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="brand">CodeSentinel</div>
          <div className="subtitle">AI-Powered Code Security Scanner</div>
        </div>

        <div className={`ai-status ${result?.ai_enabled ? 'active' : ''}`}>
          <span className="status-dot"></span>
          {result?.ai_enabled ? 'AI Analysis Enabled' : 'AI Security'}
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="eyebrow">SECURITY ANALYSIS</div>
            <h1>Find vulnerabilities before attackers do.</h1>
            <p>
              Scan your source code for security vulnerabilities and get
              AI-powered explanations and secure fixes.
            </p>
          </div>
        </section>

        <section className="scanner-card">
          <div className="scanner-header">
            <div>
              <h2>Code Scanner</h2>
              <p>Paste your source code and run a security analysis.</p>
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
            placeholder="Paste your source code here..."
            spellCheck="false"
          />

          <div className="scanner-footer">
            <span>{code.split('\n').length} lines</span>

            <button onClick={scanCode} disabled={loading}>
              {loading ? 'Analyzing...' : 'Scan Code'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </section>

        {result && (
          <>
            <section className="results-header">
              <div>
                <div className="eyebrow">SCAN RESULTS</div>
                <h2>Security Analysis</h2>
              </div>

              {result.ai_enabled && (
                <div className="ai-badge">
                  ✦ AI Analysis Complete
                </div>
              )}
            </section>

            <section className="stats-grid">
              <div className="stat-card score-card">
                <div className="stat-label">Security Score</div>
                <div className="score">{result.score}</div>
                <div className="score-out-of">out of 100</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Critical</div>
                <div className="stat-number critical">
                  {result.summary.critical}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">High</div>
                <div className="stat-number high">
                  {result.summary.high}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Medium</div>
                <div className="stat-number medium">
                  {result.summary.medium}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Total Findings</div>
                <div className="stat-number">
                  {result.summary.total}
                </div>
              </div>
            </section>

            {result.findings.length === 0 ? (
              <section className="clean-result">
                <div className="clean-icon">✓</div>
                <h2>No vulnerabilities found</h2>
                <p>
                  CodeSentinel did not detect any known security issues in
                  the submitted code.
                </p>
              </section>
            ) : (
              <section className="findings-section">
                <div className="section-title">
                  <h2>Security Findings</h2>
                  <span>{result.findings.length} detected</span>
                </div>

                <div className="findings-list">
                  {result.findings.map((finding) => (
                    <article className="finding-card" key={finding.id}>
                      <div className="finding-top">
                        <div>
                          <div className="finding-title-row">
                            <h3>{finding.vulnerability}</h3>
                            <span
                              className={`severity ${getSeverityClass(
                                finding.severity
                              )}`}
                            >
                              {finding.severity}
                            </span>
                          </div>

                          <div className="finding-meta">
                            <span>{finding.id}</span>
                            <span>Line {finding.line}</span>
                            <span>{finding.category}</span>
                            {finding.cwe && <span>{finding.cwe}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="source-code">
                        <div className="source-label">VULNERABLE CODE</div>
                        <pre>{finding.code}</pre>
                      </div>

                      <div className="finding-description">
                        <div className="content-label">Scanner Analysis</div>
                        <p>{finding.description}</p>
                      </div>

                      <div className="recommendation">
                        <div className="content-label">Recommendation</div>
                        <p>{finding.recommendation}</p>
                      </div>

                      {finding.ai_analysis && (
                        <div className="ai-analysis">
                          <div className="ai-analysis-header">
                            <div>
                              <span className="ai-symbol">✦</span>
                              <span>AI Security Analysis</span>
                            </div>
                            <span className="ai-powered">POWERED BY AI</span>
                          </div>

                          <div className="ai-grid">
                            <div className="ai-panel">
                              <div className="content-label">
                                Why is this vulnerable?
                              </div>
                              <p>
                                {finding.ai_analysis.explanation}
                              </p>
                            </div>

                            <div className="ai-panel">
                              <div className="content-label">
                                Attack Impact
                              </div>
                              <p>
                                {finding.ai_analysis.attack_impact}
                              </p>
                            </div>

                            <div className="ai-panel">
                              <div className="content-label">
                                Secure Fix
                              </div>
                              <p>
                                {finding.ai_analysis.secure_fix}
                              </p>
                            </div>

                            <div className="ai-panel full-width">
                              <div className="content-label">
                                AI-Generated Fixed Code
                              </div>
                              <pre className="fixed-code">
                                {finding.ai_analysis.fixed_code}
                              </pre>
                            </div>

                            <div className="ai-panel full-width tip-panel">
                              <div className="content-label">
                                Developer Tip
                              </div>
                              <p>
                                {finding.ai_analysis.developer_tip}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App