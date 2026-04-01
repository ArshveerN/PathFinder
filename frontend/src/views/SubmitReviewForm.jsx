import { useState } from 'react';
import supabase from '../supabaseClient';

export default function SubmitReviewForm({ courseCode, userId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [grade, setGrade] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    
    // Parse the grade. If it's empty, send null.
    const parsedGrade = grade !== '' ? parseInt(grade, 10) : null;

    if (parsedGrade !== null && (parsedGrade < 0 || parsedGrade > 100)) {
      setErrorMsg('Grade must be between 0 and 100.');
      setSubmitting(false);
      return;
    }
    
    const { error } = await supabase
      .from('CourseReviews')
      .insert([{ 
        course_code: courseCode, 
        user_id: userId, 
        rating: parseInt(rating), 
        grade: parsedGrade, 
        review_text: text 
      }]);

    setSubmitting(false);
    
    if (error) {
      if (error.code === '23505') { 
        setErrorMsg('You have already submitted a review for this course.');
      } else {
        setErrorMsg(error.message);
      }
    } else {
      setText('');
      setRating(5);
      setGrade('');
      onReviewSubmitted(); 
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px', 
      background: '#ffffff', 
      padding: '16px', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb', 
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor={`rating-${courseCode}`} style={{ fontSize: '0.95em', fontWeight: '500', color: '#374151' }}>
            Rating:
          </label>
          <select 
            id={`rating-${courseCode}`}
            value={rating} 
            onChange={(e) => setRating(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
          >
            <option value={5}>5 - Excellent</option>
            <option value={4}>4 - Good</option>
            <option value={3}>3 - Average</option>
            <option value={2}>2 - Poor</option>
            <option value={1}>1 - Terrible</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor={`grade-${courseCode}`} style={{ fontSize: '0.95em', fontWeight: '500', color: '#374151' }}>
            Grade (%):
          </label>
          <input
            id={`grade-${courseCode}`}
            type="number"
            min="0"
            max="100"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="e.g. 85"
            style={{ padding: '6px 10px', width: '80px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb' }}
          />
        </div>

      </div>
      
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="Share your experience (difficulty, workload, advice)..."
        required
        style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      
      {errorMsg && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.85em', fontWeight: '500' }}>{errorMsg}</p>}
      
      <button 
        onClick={handleSubmit}
        disabled={submitting}
        style={{ 
          alignSelf: 'flex-start', 
          padding: '8px 16px', 
          background: submitting ? '#93c5fd' : '#2563eb', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: submitting ? 'not-allowed' : 'pointer', 
          fontWeight: '500',
          transition: 'background 0.15s'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}