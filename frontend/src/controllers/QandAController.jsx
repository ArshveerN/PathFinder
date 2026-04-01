import useQandA from '../models/useQandA'
import QandAView from '../views/QandAView'

function QandAController({ onBack }) {
  const {
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
    setName,
    setQuestion,
    setAnswerName,
    setAnswerText,
    handleSubmit,
    handleVote,
    handleAnswerVote,
    toggleExpand,
    submitAnswer,
    deleteQuestion,
    deleteAnswer,
    userId,
    clearSuccess,
    clearError,
  } = useQandA()

  return (
    <QandAView
      name={name}
      question={question}
      submitting={submitting}
      successMessage={successMessage}
      error={error}
      posts={posts}
      loadingPosts={loadingPosts}
      expandedPostId={expandedPostId}
      answers={answers}
      loadingAnswers={loadingAnswers}
      answerName={answerName}
      answerText={answerText}
      submittingAnswer={submittingAnswer}
      voteHistory={voteHistory}
      answerVoteHistory={answerVoteHistory}
      onNameChange={(e) => setName(e.target.value)}
      onQuestionChange={(e) => setQuestion(e.target.value)}
      onAnswerNameChange={(e) => setAnswerName(e.target.value)}
      onAnswerTextChange={(e) => setAnswerText(e.target.value)}
      onSubmit={handleSubmit}
      onVote={handleVote}
      onAnswerVote={handleAnswerVote}
      onToggleExpand={toggleExpand}
      onSubmitAnswer={submitAnswer}
      onDeleteQuestion={deleteQuestion}
      onDeleteAnswer={deleteAnswer}
      userId={userId}
      onBack={onBack}
      onClearSuccess={clearSuccess}
      onClearError={clearError}
    />
  )
}

export default QandAController
