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

// ── Controlled Domain Lexicon Keyword Ranking Engine ────────────────────────
export const scoreCommentsWithLexicon = (commentsPool) => {
  if (!commentsPool || commentsPool.length === 0) return [];

  const topicPoolCounts = {};
  const kwPoolCounts = {};
  const commentTopicMatches = commentsPool.map(s => {
    if (!s.Message || !s.Message.trim()) return { matchedTopics: [] };
    const msgLower = s.Message.toLowerCase();
    const matchedTopics = [];

    Object.entries(CONTROLLED_LEXICON).forEach(([catName, categoryTopics]) => {
      Object.entries(categoryTopics).forEach(([topic, synonyms]) => {
        let bestSynLen = 0;
        let matchedSyn = '';
        for (const syn of synonyms) {
          const synLower = syn.toLowerCase();
          const escaped = synLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Strict regex using non-word/boundary checks to avoid partial substring collisions
          const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
          if (regex.test(msgLower)) {
            if (synLower.length > bestSynLen) {
              bestSynLen = synLower.length;
              matchedSyn = synLower;
            }
          }
        }
        if (bestSynLen > 0) {
          matchedTopics.push({ topic, category: catName, matchLen: bestSynLen, keyword: matchedSyn });
        }
      });
    });

    matchedTopics.forEach(m => {
      topicPoolCounts[m.topic] = (topicPoolCounts[m.topic] || 0) + 1;
      if (m.keyword) {
        kwPoolCounts[m.keyword] = (kwPoolCounts[m.keyword] || 0) + 1;
      }
    });

    return { matchedTopics };
  });

  return commentsPool.map((commentObj, idx) => {
    if (!commentObj || !commentObj.Message) {
      return { ...commentObj, tfidfScore: 0, termScore: 0, blendedScore: 0, topTerm: '', maxTermFreq: 0 };
    }

    const { matchedTopics } = commentTopicMatches[idx];
    let bestTopic = '';
    let bestKw = '';
    let bestTopicScore = -1;
    let maxTopicFreq = 0;
    let totalTopicScore = 0;

    matchedTopics.forEach(m => {
      const count = topicPoolCounts[m.topic] || 0;
      totalTopicScore += count;
      if (count > maxTopicFreq) {
        maxTopicFreq = count;
      }

      // Scoring weight:
      // 1. Matches comment's assigned category (+15 points)
      // 2. Longer, more specific phrase match (m.matchLen * 1.5)
      // 3. Pool frequency of the topic (count * 0.5)
      const isSameCategory = commentObj.Category && commentObj.Category === m.category ? 15 : 0;
      const candidateScore = isSameCategory + (m.matchLen * 1.5) + (count * 0.5);

      if (candidateScore > bestTopicScore) {
        bestTopicScore = candidateScore;
        bestTopic = m.topic;
        bestKw = m.keyword;
      }
    });

    const normalizedTopicScore = matchedTopics.length > 0
      ? Number((totalTopicScore / Math.sqrt(matchedTopics.length)).toFixed(2))
      : 0;

    const magnitude = Math.abs(getSurveyScore(commentObj));
    const blendedScore = Number(((0.7 * normalizedTopicScore) + (0.3 * magnitude * 10)).toFixed(2));

    const assignedKeyword = bestKw || (commentObj.Category ? commentObj.Category.toLowerCase() : 'general');
    const assignedFreq = (bestKw && kwPoolCounts[bestKw]) || topicPoolCounts[bestTopic] || maxTopicFreq || 1;

    return {
      ...commentObj,
      tfidfScore: normalizedTopicScore,
      termScore: normalizedTopicScore,
      blendedScore,
      topTerm: assignedKeyword,
      maxTermFreq: assignedFreq
    };
  });
};

// ── Simple & Diverse Top Comment Selector (Clean Deduplication) ─────────────
export const selectDiverseTopComments = (scoredList, limit = 5) => {
  if (!scoredList || scoredList.length === 0) return [];

  const selected = [];
  const seenTexts = new Set();
  const keywordCounts = {};

  const cleanTextKey = (msg) => {
    if (!msg) return '';
    const str = typeof msg === 'string' ? msg : (msg.Message || '');
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
  };

  // 1. Pick unique comments, spreading across diverse keywords
  for (const comment of scoredList) {
    if (selected.length >= limit) break;
    const textKey = cleanTextKey(comment.Message);
    if (!textKey || seenTexts.has(textKey)) continue;

    const kw = (comment.topTerm || 'general').toLowerCase();
    if ((keywordCounts[kw] || 0) < 2) {
      selected.push(comment);
      seenTexts.add(textKey);
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    }
  }

  // 2. Fill any remaining slots with other unique comments
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
