import { useState } from 'react'
import './CareerPaths.css'
import './QandA.css'

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function QandAView({
  name,
  question,
  submitting,
  successMessage,
  error,
  posts,
  loadingPosts,
  expandedPostId,
  answers,
  loadingAnswers,
  answerName,
  answerText,
  submittingAnswer,
  voteHistory,
  answerVoteHistory,
  userId,
  onNameChange,
  onQuestionChange,
  onAnswerNameChange,
  onAnswerTextChange,
  onSubmit,
  onVote,
  onAnswerVote,
  onToggleExpand,
  onSubmitAnswer,
  onDeleteQuestion,
  onDeleteAnswer,
  onBack,
  onClearSuccess,
  onClearError,
}) {
  const [confirm, setConfirm] = useState(null)

  const askConfirm = (message, onConfirm) => setConfirm({ message, onConfirm })
  const closeConfirm = () => setConfirm(null)

  return (
    <div className="career-paths-container">
      <div className="career-paths-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>Q &amp; A Forum</h1>
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

          {posts.map((post) => {
            const postId = post.Id ?? post.id
            const isExpanded = expandedPostId === postId
            const postAnswers = answers[postId] || []
            const isLoadingAnswers = loadingAnswers[postId]
            const userVote = voteHistory[postId] || null
            // Use live count after expanded, pre-loaded count before first expand
            const answerCount = answers[postId] !== undefined ? postAnswers.length : (post._answerCount ?? 0)

            return (
              <div key={postId} className={`post-card ${isExpanded ? 'post-card-expanded' : ''}`}>
                <div className="post-row">
                  {/* Vote column */}
                  <div className="vote-col">
                    <button
                      className={`vote-btn vote-up ${userVote === 'up' ? 'vote-active-up' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onVote(postId, 'up') }}
                      aria-label="Upvote"
                    >
                      ▲
                    </button>
                    <span className={`vote-count ${(post.Votes ?? post.votes ?? 0) > 0 ? 'vote-positive' : (post.Votes ?? post.votes ?? 0) < 0 ? 'vote-negative' : ''}`}>
                      {post.Votes ?? post.votes ?? 0}
                    </span>
                    <button
                      className={`vote-btn vote-down ${userVote === 'down' ? 'vote-active-down' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onVote(postId, 'down') }}
                      aria-label="Downvote"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Post content */}
                  <div className="post-content" onClick={() => onToggleExpand(postId)}>
                    <div className="post-header">
                      <span className="post-author">{post.Name}</span>
                      <span className="post-date">{post.Data} · {post.Time}</span>
                      {userId && post.user_id === userId && (
                        <button
                          className="delete-btn"
                          onClick={(e) => { e.stopPropagation(); askConfirm('Delete this question and all its answers?', () => onDeleteQuestion(postId)) }}
                          aria-label="Delete question"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="post-question">{post.Question}</div>
                    {post.ai_answer && (
                      <div className="ai-answer-box" onClick={e => e.stopPropagation()}>
                        <span className="ai-answer-label">🤖 AI Suggestion</span>
                        <p className="ai-answer-text">{post.ai_answer}</p>
                      </div>
                    )}
                    <div className="post-meta">
                      <span className="post-answers-count">
                        {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
                      </span>
                      <span className="post-expand-hint">
                        {isExpanded ? 'Click to collapse' : 'Click to answer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded: answers + answer form */}
                {isExpanded && (
                  <div className="answers-section">
                    <div className="answers-divider" />

                    {isLoadingAnswers && (
                      <div className="answers-loading">Loading answers...</div>
                    )}

                    {!isLoadingAnswers && postAnswers.length === 0 && (
                      <div className="answers-empty">No answers yet. Be the first to respond!</div>
                    )}

                    {postAnswers.map((a) => {
                      const answerId = a.Id ?? a.id
                      const answerUserVote = answerVoteHistory[answerId] || null
                      return (
                        <div key={answerId} className="answer-card">
                          <div className="answer-row">
                            <div className="vote-col vote-col-sm">
                              <button
                                className={`vote-btn vote-up ${answerUserVote === 'up' ? 'vote-active-up' : ''}`}
                                onClick={() => onAnswerVote(answerId, postId, 'up')}
                                aria-label="Upvote answer"
                              >
                                ▲
                              </button>
                              <span className={`vote-count ${(a.Votes ?? a.votes ?? 0) > 0 ? 'vote-positive' : (a.Votes ?? a.votes ?? 0) < 0 ? 'vote-negative' : ''}`}>
                                {a.Votes ?? a.votes ?? 0}
                              </span>
                              <button
                                className={`vote-btn vote-down ${answerUserVote === 'down' ? 'vote-active-down' : ''}`}
                                onClick={() => onAnswerVote(answerId, postId, 'down')}
                                aria-label="Downvote answer"
                              >
                                ▼
                              </button>
                            </div>
                            <div className="answer-content">
                              <div className="answer-header">
                                <span className="answer-author">{a.Name}</span>
                                <span className="answer-date">{a.Data} · {a.Time}</span>
                                {userId && a.user_id === userId && (
                                  <button
                                    className="delete-btn"
                                    onClick={() => askConfirm('Delete this answer?', () => onDeleteAnswer(answerId, postId))}
                                    aria-label="Delete answer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <div className="answer-body">{a.Answer}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Answer form */}
                    <div className="answer-form">
                      <h4 className="answer-form-title">Your Answer</h4>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Your name"
                        value={answerName}
                        onChange={onAnswerNameChange}
                        disabled={submittingAnswer}
                      />
                      <textarea
                        className="form-textarea"
                        placeholder="Write your answer..."
                        value={answerText}
                        onChange={onAnswerTextChange}
                        disabled={submittingAnswer}
                        rows={3}
                      />
                      <button
                        className="answer-submit-btn"
                        onClick={() => onSubmitAnswer(postId)}
                        disabled={submittingAnswer}
                      >
                        {submittingAnswer ? 'Posting...' : 'Post Answer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); closeConfirm() }}
          onCancel={closeConfirm}
        />
      )}
    </div>
  )
}

export default QandAView
