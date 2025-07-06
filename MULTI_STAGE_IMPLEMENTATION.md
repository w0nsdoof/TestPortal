# Multi-Stage Test Implementation

This document describes the implementation of the multi-stage KELET test system that replaces the previous single-stage approach.

## Overview

The new system implements a three-stage test flow:

1. **Grammar Stage** (20 minutes)
2. **Vocabulary Stage** (20 minutes)
3. **Reading Stage** (15 minutes)

Each stage must be completed in sequence, with proper time management and session tracking.

## Frontend Components

### 1. MultiStageQuiz Component (`multi-stage-quiz.tsx`)

The main component that handles the multi-stage test flow.

**Key Features:**

- Stage-based question loading
- Real-time countdown timers
- Automatic stage progression
- Session status monitoring
- Answer submission per stage

**State Management:**

```typescript
interface StageInfo {
  type: StageType;
  status: StageStatus;
  questions: QuizQuestion[];
  currentQuestion: number;
  answers: Record<number, string | number>;
  timeLimit: number;
  remainingTime: number;
  startedAt?: Date;
}
```

### 2. SessionStatus Component (`components/session-status.tsx`)

Displays current test session progress and remaining time for each stage.

**Features:**

- Real-time session status updates
- Stage completion tracking
- Remaining time display
- Progress visualization

## Backend API Integration

### Required Endpoints

#### 1. Session Status Check

```
GET /session-status/?iin=123
```

**Response:**

```json
{
  "grammar_started_at": "2024-01-01T10:00:00Z",
  "grammar_finished_at": "2024-01-01T10:20:00Z",
  "vocabulary_started_at": "2024-01-01T10:20:00Z",
  "vocabulary_finished_at": null,
  "reading_started_at": null,
  "reading_finished_at": null,
  "session_complete": false,
  "remaining_time_grammar": 0,
  "remaining_time_vocabulary": 15,
  "remaining_time_reading": 15
}
```

#### 2. Load Stage Questions

```
GET /questions-by-stage/?iin=123&stage_type=Grammar
```

**Response:**

```json
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "prompt": "Choose the correct form...",
      "paragraph": null,
      "level": "B1",
      "options": [
        { "id": 1, "text": "Option A", "label": "A" },
        { "id": 2, "text": "Option B", "label": "B" }
      ]
    }
  ],
  "remaining_time_minutes": 20
}
```

#### 3. Submit Answers

```
POST /submit/
```

**Request Body:**

```json
{
  "iin": "123",
  "level": "B1",
  "answers": [
    { "question_id": 1, "selected_option": 2 },
    { "question_id": 2, "selected_option": 1 }
  ]
}
```

#### 4. Finish Stage

```
POST /finish-stage/?iin=123&stage_type=Grammar
```

**Response:**

```json
{
  "success": true,
  "session_complete": false,
  "next_stage": "Vocabulary"
}
```

## Test Flow

### 1. Initialization

1. Check session status
2. If session complete → redirect to results
3. If session in progress → resume from current stage
4. If new session → start with Grammar stage

### 2. Stage Execution

1. Load questions for current stage
2. Start countdown timer
3. Display questions one by one
4. Collect answers
5. Auto-submit when time expires or user finishes

### 3. Stage Completion

1. Submit answers to backend
2. Call finish-stage endpoint
3. Update stage status
4. Move to next stage or show results

### 4. Session Completion

1. All stages finished
2. Show results page
3. Display final score and level

## Time Management

### Timer Implementation

```typescript
const startStageTimer = (stageIndex: number, initialTime: number) => {
  timerRef.current = setInterval(() => {
    setStages((prev) =>
      prev.map((stage, index) => {
        if (index === stageIndex && stage.status === "in_progress") {
          const newRemainingTime = stage.remainingTime - 1;

          if (newRemainingTime <= 0) {
            clearInterval(timerRef.current!);
            finishStage(stageIndex);
            return { ...stage, remainingTime: 0 };
          }

          return { ...stage, remainingTime: newRemainingTime };
        }
        return stage;
      })
    );
  }, 1000);
};
```

### Time Limits

- **Grammar**: 20 minutes
- **Vocabulary**: 20 minutes
- **Reading**: 15 minutes
- **Total**: 55 minutes

## Error Handling

### Common Scenarios

1. **Network Issues**: Retry with exponential backoff
2. **Time Expired**: Auto-submit current answers
3. **Session Not Found**: Redirect to login
4. **Stage Already Finished**: Prevent duplicate submission

### Recovery Mechanisms

- Session status polling every 30 seconds
- Local storage backup of answers
- Graceful degradation for offline scenarios

## Database Schema

### TestSession Table

```sql
CREATE TABLE test_sessions (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER REFERENCES applicants(id),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  grammar_started_at TIMESTAMP,
  grammar_finished_at TIMESTAMP,
  vocabulary_started_at TIMESTAMP,
  vocabulary_finished_at TIMESTAMP,
  reading_started_at TIMESTAMP,
  reading_finished_at TIMESTAMP
);
```

### UserAnswer Table

```sql
CREATE TABLE user_answers (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER REFERENCES applicants(id),
  test_session_id INTEGER REFERENCES test_sessions(id),
  question_id INTEGER REFERENCES questions(id),
  selected_option_id INTEGER REFERENCES options(id),
  is_correct BOOLEAN,
  answered_at TIMESTAMP
);
```

### TestResult Table

```sql
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER REFERENCES applicants(id),
  level VARCHAR(2),
  correct_answers INTEGER,
  total_questions INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Migration from Single-Stage

### Changes Required

1. Update quiz page to use `MultiStageQuiz` component
2. Modify results page to use `/submit/` endpoint
3. Add session status monitoring
4. Implement stage-based navigation

### Backward Compatibility

- Keep old endpoints for existing sessions
- Gradual migration of active sessions
- Fallback to single-stage for incomplete sessions

## Testing

### Test Cases

1. **Complete Flow**: All stages from start to finish
2. **Time Expiration**: Auto-submit when time runs out
3. **Network Recovery**: Resume after connection loss
4. **Session Resume**: Continue from interrupted session
5. **Error Scenarios**: Invalid responses, missing data

### Performance Considerations

- Efficient timer management
- Minimal API calls
- Optimized state updates
- Memory leak prevention

## Security

### Data Protection

- Secure answer transmission
- Session validation
- Time-based access control
- Anti-cheating measures

### Validation

- IIN verification
- Session ownership
- Time limit enforcement
- Answer integrity

## Future Enhancements

### Planned Features

1. **Adaptive Testing**: Dynamic question selection
2. **Progress Persistence**: Save partial progress
3. **Offline Support**: Local question caching
4. **Analytics**: Detailed performance metrics
5. **Accessibility**: Screen reader support

### Scalability

- Load balancing for high traffic
- Database optimization
- Caching strategies
- CDN integration

## Troubleshooting

### Common Issues

1. **Timer Drift**: Use server time synchronization
2. **State Loss**: Implement robust state management
3. **API Failures**: Add comprehensive error handling
4. **Performance**: Optimize re-renders and API calls

### Debug Tools

- Session status monitoring
- Answer logging
- Performance metrics
- Error tracking
