# Consistency Engine - Student Deep Dive

This document explains how NarrativeFlow checks story consistency using rule-based logic and AI analysis.

## 0) Learning Goals

- Understand what "consistency" means in narrative writing.
- Learn which checks are rule-based and which are AI-based.
- Interpret the output and use it to improve writing.

## 1) What Is Consistency?

Consistency means your story follows its own rules. Examples:

- A character does not suddenly act out of character.
- Timeline events do not contradict each other.
- The POV stays consistent.
- Magic rules are not broken without explanation.

## 2) Components

- backend/app/services/consistency_engine.py
- backend/app/routes/ai_tools.py
- backend/app/services/gemini_service.py

## 3) Rule-Based Checks

Rule-based checks are fast heuristics:

- Character voice and behavior
- POV consistency
- Tense consistency
- Timeline contradictions
- World rule violations
- Tone drift

These checks are cheap and fast, but less flexible than AI.

## 4) AI Deep Analysis

The AI analysis runs a structured prompt that asks the model to find:

- Issue type
- Severity
- Location in text
- Suggested fix

This provides richer feedback but is slower and less deterministic.

## 5) Output Format

The output includes:

- A list of issues
- Severity (low, medium, high, critical)
- Suggested fixes
- Summary of overall quality

## 6) Strengths and Limitations

Strengths:

- Catches subtle issues (tone drift, implied contradictions)
- Provides actionable feedback

Limitations:

- Can produce false positives
- Depends on prompt quality and model behavior

## 7) How to Use the Results

- Treat results as guidance, not absolute truth.
- Focus on high-severity issues first.
- If something seems wrong, verify against story facts.

## 8) Exercises

1. Introduce a deliberate timeline contradiction and see if it is flagged.
2. Change POV mid-chapter and test detection.
3. Add a new world rule and see if the AI respects it.

## 9) Summary

The consistency engine combines fast heuristics with deeper AI review. It is a writing assistant, not a judge, and should be used to guide revisions.# Consistency Engine - Deep Dive

This document describes the consistency analysis system, including rule-based checks and AI-powered analysis.

## 1) Components

- backend/app/services/consistency_engine.py
- backend/app/routes/ai_tools.py
- backend/app/services/gemini_service.py

## 2) Rule-Based Checks

The engine performs lightweight checks on:

- Character voice and behavior
- POV consistency
- Tense consistency
- Timeline contradictions
- World rule violations
- Tone drift

## 3) AI Deep Analysis

When requested, a deeper analysis is performed via Ollama using a structured prompt that asks for:

- Issue type
- Severity
- Location in text
- Suggested fixes

## 4) Output Format

Outputs include:

- Issue list with type, severity, description, and suggestion
- Overall score and summary
- Recommendations for improvement

## 5) Integration Points

- Grammar and quick-check endpoints use rule-based analysis.
- Recap and analysis endpoints can include deep AI evaluation.
