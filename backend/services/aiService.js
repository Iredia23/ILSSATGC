// backend/services/aiService.js
// Google Gemini AI service — powers schedule suggestions, conflict resolution,
// workload analysis, and the chat assistant

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const MODEL = "gemini-3.5-flash";

/**
 * Simple text generation helper
 */
async function generate(prompt, temperature = 0.3) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
    },
  });
  return result.response.text();
}

// ═══════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════

/**
 * 1. SMART SCHEDULE SUGGESTIONS
 * Given unscheduled courses, available slots, and existing schedule,
 * suggest optimal placements.
 */
export async function suggestSchedule(context) {
  const { unscheduled, timeSlots, venues, existingSchedule, semester } = context;

  const prompt = `You are an expert university timetable scheduling assistant for the Federal University of Technology, Minna (FUT Minna) — the scheduling system serves all schools and departments across the institution.

## CURRENT CONTEXT
Semester: ${semester || "Not specified"}

## UNSCHEDULED COURSES (need to be scheduled)
These courses have not yet been assigned a venue and time. A lecturer assignment is optional — some courses already have a lecturer, others do not, and courses may be scheduled with or without one:
${JSON.stringify(unscheduled, null, 2)}

## AVAILABLE TIME SLOTS
${JSON.stringify(timeSlots, null, 2)}

## AVAILABLE VENUES
${JSON.stringify(venues, null, 2)}

## EXISTING SCHEDULE (already booked)
${JSON.stringify(existingSchedule, null, 2)}

## CONSTRAINTS
- Operating hours: 08:00–13:00 (morning), 14:00–18:00 (afternoon), 13:00–14:00 is lunch break
- Only Monday to Friday
- Each course is 1 hour long
- A venue cannot be double-booked at the same time
- A lecturer cannot teach two courses at the same time
- Courses at the same level should ideally not run simultaneously (students can't be in two places)

## YOUR TASK
Analyze the unscheduled courses and suggest up to 5 practical placements.
For each suggestion, provide:
1. The course code and title
2. Recommended venue
3. Recommended day and time
4. A brief reason why this placement works

Format your response as clean JSON:
{
  "suggestions": [
    {
      "courseCode": "CSC 301",
      "courseTitle": "Software Engineering",
      "venue": "Lecture Hall A",
      "day": "Monday",
      "time": "09:00",
      "reason": "Lecture Hall A is free at this time and the lecturer has no conflicts."
    }
  ],
  "summary": "Brief overview of the scheduling strategy"
}`;

  const text = await generate(prompt);
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { suggestions: [], summary: text };
  }
}

/**
 * 2. CONFLICT RESOLUTION
 * Given a detected conflict, suggest alternative arrangements.
 */
export async function resolveConflict(context) {
  const { conflicts, course, currentVenue, currentDay, currentTime, availableSlots, venues } =
    context;

  const prompt = `You are an expert university timetable conflict resolver.

## THE CONFLICT
${JSON.stringify(conflicts, null, 2)}

## COURSE BEING ASSIGNED
${JSON.stringify(course, null, 2)}

## CURRENT ATTEMPT
Venue: ${currentVenue}
Day: ${currentDay}
Time: ${currentTime}

## ALTERNATIVE OPTIONS
Available time slots: ${JSON.stringify(availableSlots, null, 2)}
Available venues: ${JSON.stringify(venues, null, 2)}

## YOUR TASK
Suggest up to 3 alternative placements that would avoid ALL the listed conflicts.
For each suggestion explain which conflict it resolves.

Format as JSON:
{
  "alternatives": [
    {
      "venue": "Lecture Hall B",
      "day": "Monday",
      "time": "10:00",
      "resolvesConflict": "Venue is free at this time",
      "confidence": "high"
    }
  ],
  "recommendation": "Best option"
}`;

  const text = await generate(prompt);
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { alternatives: [], recommendation: text };
  }
}

/**
 * 3. WORKLOAD BALANCING
 * Analyze lecturer workload distribution and suggest rebalancing.
 */
export async function analyzeWorkload(context) {
  const { lecturers, assignments, maxWorkload } = context;

  const prompt = `You are an expert academic workload analyst.

## DEPARTMENT CONTEXT
Max recommended courses per lecturer: ${maxWorkload || 4}

## LECTURERS AND THEIR CURRENT WORKLOAD
${JSON.stringify(lecturers, null, 2)}

## CURRENT COURSE ASSIGNMENTS
${JSON.stringify(assignments, null, 2)}

## YOUR TASK
Analyze the workload distribution and provide:
1. A fairness assessment (balanced, slightly imbalanced, severely imbalanced)
2. Identify overloaded lecturers (those exceeding the max)
3. Identify underloaded lecturers (those with significantly fewer than average)
4. Suggest up to 3 specific reassignments to balance the load
5. Calculate the Gini coefficient or workload variance as a simple 0-100 fairness score

Format as JSON:
{
  "fairnessScore": 75,
  "status": "slightly imbalanced",
  "overloaded": [
    { "name": "Dr. Smith", "currentCourses": 5, "recommendedReduction": 1 }
  ],
  "underloaded": [
    { "name": "Dr. Jones", "currentCourses": 2, "canTakeMore": 2 }
  ],
  "suggestions": [
    {
      "from": "Dr. Smith",
      "to": "Dr. Jones",
      "course": "CSC 305",
      "reason": "Dr. Smith has 5 courses (overloaded) while Dr. Jones has only 2"
    }
  ],
  "insight": "Brief summary of the workload analysis"
}`;

  const text = await generate(prompt);
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      fairnessScore: 0,
      status: "unknown",
      overloaded: [],
      underloaded: [],
      suggestions: [],
      insight: text,
    };
  }
}

/**
 * 4. CHAT ASSISTANT (RAG-style)
 * Answer questions about the schedule using current data as context.
 */
export async function chatWithSchedule(context) {
  const { message, schedule, courses, lecturers, venues, timeSlots, semester } = context;

  const prompt = `You are an AI scheduling assistant for the Federal University of Technology, Minna (FUT Minna). You help staff across all schools and departments understand the timetable.

## CURRENT SEMESTER
${semester || "Not specified"}

## ALL SCHEDULED COURSES
${JSON.stringify(schedule, null, 2)}

## COURSE CATALOG
${JSON.stringify(courses, null, 2)}

## TEACHING STAFF
${JSON.stringify(lecturers, null, 2)}

## VENUES
${JSON.stringify(venues, null, 2)}

## TIME SLOTS
${JSON.stringify(timeSlots, null, 2)}

## USER QUESTION
${message}

## INSTRUCTIONS
Answer the user's question using ONLY the data provided above. If the data doesn't contain the answer, say so — don't make up information.
Keep answers concise and practical. If relevant, mention course codes, times, and venues.
Be friendly and professional. Use emojis sparingly.

Format your response as JSON:
{
  "answer": "Your answer to the user's question",
  "relevantData": ["course code or lecturer name that was referenced"],
  "followUpHint": "Optional suggestion for what the user might ask next"
}`;

  const text = await generate(prompt, 0.5);
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { answer: text, relevantData: [], followUpHint: null };
  }
}
