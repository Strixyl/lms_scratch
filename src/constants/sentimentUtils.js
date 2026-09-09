// ── Sentiment Dashboard — Pure Utility Functions ────────────────────────────
// Non-React helpers for scoring, formatting, stemming, and term frequency.

import {
  RATING_SCORES,
  SATISFACTION_SCALE,
  STOPWORDS,
  CONTROLLED_LEXICON,
} from './sentimentConstants';

// ── Rating Formatter ────────────────────────────────────────────────────────
const RATING_SHORT_MAP = {
  very_satisfied: '5',
  satisfied: '4',
  neutral: '3',
  dissatisfied: '2',
  very_dissatisfied: '1',
  na: 'N/A',
};

export const formatRatingShort = (val) => {
  if (!val) return 'N/A';
  return RATING_SHORT_MAP[val] || val;
};

// ── Satisfaction Average (plain 1-5 scale) ──────────────────────────────────
export const getSatisfactionAverage = (s) => {
  const qList = [
    s.Question1, s.Question2, s.Question3, s.Question4, s.Question5,
    s.Question6, s.Question7, s.Question8, s.Question9, s.Question10
  ].map(q => SATISFACTION_SCALE[q]).filter(v => v != null);
  return qList.length > 0 ? qList.reduce((a, b) => a + b, 0) / qList.length : 0;
};

// ── Survey Sentiment Score ──────────────────────────────────────────────────
export const getSurveyScore = (s) => {
  if (typeof s.SentimentScore === 'number' && !isNaN(s.SentimentScore)) {
    return s.SentimentScore;
  }

  const qList = [
    s.Question1, s.Question2, s.Question3, s.Question4, s.Question5,
    s.Question6, s.Question7, s.Question8, s.Question9, s.Question10
  ].filter(q => q != null && q !== 'na');

  const ratingAvg = qList.length > 0
    ? qList.reduce((sum, q) => sum + (RATING_SCORES[q] ?? 0), 0) / qList.length
    : 0;

  if (!s.Message || !s.Message.trim()) {
    return ratingAvg;
  }

  return s.SentimentResult === 'Positive' ? 1.0 : s.SentimentResult === 'Negative' ? -1.0 : 0.0;
};

// ── Word Stemmer ────────────────────────────────────────────────────────────
export const stemWord = (word) => {
  if (!word || word.length <= 3) return word;
  return word
    .replace(/(?:ies)$/i, 'y')
    .replace(/(?:s|es|ing|ed)$/i, '')
    .toLowerCase();
};

// ── Term Frequency Builder (for word cloud) ─────────────────────────────────
export const buildTermFrequencies = (pool) => {
  const freq = {};
  const origCounts = {};
  const sentimentCounts = {};

  pool.forEach(s => {
    if (!s.Message) return;
    const sent = s.SentimentResult || 'Neutral';
    const words = s.Message.toLowerCase().match(/[a-z']+/g) || [];
    words.forEach(rawW => {
      if (rawW.length < 3 || STOPWORDS.has(rawW)) return;
      const stem = stemWord(rawW);
      freq[stem] = (freq[stem] || 0) + 1;
      if (!origCounts[stem]) origCounts[stem] = {};
      origCounts[stem][rawW] = (origCounts[stem][rawW] || 0) + 1;

      if (!sentimentCounts[stem]) sentimentCounts[stem] = { Positive: 0, Negative: 0, Neutral: 0 };
      if (sentimentCounts[stem][sent] !== undefined) {
        sentimentCounts[stem][sent]++;
      }
    });
  });
  const displayMap = {};
  Object.keys(origCounts).forEach(stem => {
    displayMap[stem] = Object.entries(origCounts[stem]).sort((a, b) => b[1] - a[1])[0][0];
  });
  return { freq, displayMap, sentimentCounts };
};

// ── RoBERTa Model Confidence Comment Scorer ────────────────────────────────
export const scoreCommentsWithRoBERTa = (commentsPool) => {
  if (!commentsPool || commentsPool.length === 0) return [];

  return commentsPool.map((commentObj) => {
    if (!commentObj || !commentObj.Message) {
      return {
        ...commentObj,
        confidence: 0,
        confidencePct: '0.0',
        blendedScore: 0,
        termScore: 0,
        primaryTopic: 'General Feedback',
        topTerm: 'general',
      };
    }

    const rawScore = typeof commentObj.SentimentScore === 'number' && !isNaN(commentObj.SentimentScore)
      ? Math.abs(commentObj.SentimentScore)
      : 1.0;

    // Normalizes confidence between 0 and 1 (with precision)
    const confidence = Math.min(Math.max(rawScore, 0), 1);
    const confidencePct = (confidence * 100).toFixed(1);

    return {
      ...commentObj,
      confidence,
      confidencePct,
      // For backwards compatibility with UI components
      blendedScore: Number(confidencePct),
      termScore: Number(confidencePct),
      primaryTopic: commentObj.Category || 'General Feedback',
      topTerm: (commentObj.Category || 'general').toLowerCase(),
    };
  });
};

// Backwards-compatibility alias
export const scoreCommentsWithLexicon = scoreCommentsWithRoBERTa;

// ── Diverse Top Comment Selector (Clean Deduplication & Category Diversity) ──
export const selectDiverseTopComments = (scoredList, limit = 5) => {
  if (!scoredList || scoredList.length === 0) return [];

  const selected = [];
  const seenTexts = new Set();
  const categoryCounts = {};

  const cleanTextKey = (msg) => {
    if (!msg) return '';
    const str = typeof msg === 'string' ? msg : (msg.Message || '');
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
  };

  // 1. Pick unique comments, spreading across categories (max 2 per category for diversity)
  for (const comment of scoredList) {
    if (selected.length >= limit) break;
    const textKey = cleanTextKey(comment.Message);
    if (!textKey || seenTexts.has(textKey)) continue;

    const cat = comment.Category || 'Other';
    if ((categoryCounts[cat] || 0) < 2) {
      selected.push(comment);
      seenTexts.add(textKey);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  // 2. Fill any remaining slots with next highest confidence comments
  if (selected.length < limit) {
    for (const comment of scoredList) {
      if (selected.length >= limit) break;
      const textKey = cleanTextKey(comment.Message);
      if (textKey && !seenTexts.has(textKey)) {
        selected.push(comment);
        seenTexts.add(textKey);
      }
    }
  }

  return selected;
};

