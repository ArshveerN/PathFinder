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
    setName,
    setQuestion,
    handleSubmit,
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
      onNameChange={(e) => setName(e.target.value)}
      onQuestionChange={(e) => setQuestion(e.target.value)}
      onSubmit={handleSubmit}
      onBack={onBack}
      onClearSuccess={clearSuccess}
      onClearError={clearError}
    />
  )
}

export default QandAController
