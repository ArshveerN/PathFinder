import './CareerPaths.css'
import './QandA.css'

function QandAView({
  name,
  question,
  submitting,
  successMessage,
  error,
  posts,
  loadingPosts,
  onNameChange,
  onQuestionChange,
  onSubmit,
  onBack,
  onClearSuccess,
  onClearError,
}) {
  return (
    <div className="career-paths-container">
      <div className="career-paths-header">
        <h1>Q &amp; A Forum</h1>
        <div className="header-tabs">
          <button className="tab active" onClick={onBack}>Dashboard</button>
        </div>
      </div>

      <div className="qanda-layout">

        {/* LEFT: Post feed */}
        <div className="qanda-feed">
          <h2 className="feed-title">All Questions</h2>

          {loadingPosts && <div className="feed-status">Loading posts...</div>}
          {!loadingPosts && posts.length === 0 && (
            <div className="feed-status">No questions yet. Be the first to ask!</div>
          )}

          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <span className="post-author">{post.Name}</span>
                <span className="post-date">{post.Data} · {post.Time}</span>
              </div>
              <div className="post-question">{post.Question}</div>
            </div>
          ))}
        </div>

        {/* RIGHT: Submit form */}
        <div className="qanda-form-panel">
          <div className="qanda-card">
            <h2>Ask a Question</h2>
            <p className="qanda-subtitle">
              Your question will be visible to everyone on the forum.
            </p>

            <div className="qanda-form">
              <div className="form-group">
                <label htmlFor="qanda-name">Your Name</label>
                <input
                  id="qanda-name"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={onNameChange}
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="qanda-question">Your Question</label>
                <textarea
                  id="qanda-question"
                  placeholder="e.g. What are the prerequisites for CSC301H5?"
                  value={question}
                  onChange={onQuestionChange}
                  disabled={submitting}
                  className="form-textarea"
                  rows={5}
                />
              </div>

              {error && (
                <div className="qanda-error">
                  <span>{error}</span>
                  <button className="dismiss-btn" onClick={onClearError}>✕</button>
                </div>
              )}

              {successMessage && (
                <div className="qanda-success">
                  <span>{successMessage}</span>
                  <button className="dismiss-btn" onClick={onClearSuccess}>✕</button>
                </div>
              )}

              <button
                className="qanda-submit-btn"
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default QandAView
