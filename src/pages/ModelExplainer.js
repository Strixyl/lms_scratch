import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tooltip,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';

import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { THEME } from '../constants/themeTokens';

import {
  explainerTheme,
  DEFAULT_RATINGS,
  getDatePresetRange,
  runClientSimulation,
} from '../Components/ModelExplainer/explainerUtils';
import FeedbackDirectory from '../Components/ModelExplainer/FeedbackDirectory';
import ExecutiveVerdict from '../Components/ModelExplainer/ExecutiveVerdict';
import SentimentSynthesisTab from '../Components/ModelExplainer/SentimentSynthesisTab';
import CategoryClassificationTab from '../Components/ModelExplainer/CategoryClassificationTab';
import ReferenceGuideDrawer from '../Components/ModelExplainer/ReferenceGuideDrawer';

const DEFAULT_SAMPLE_TEXT =
  'The power outlets at the collaborative tables are very convenient for charging laptops.';
const ROWS_PER_PAGE = 6;

export default function ModelExplainer() {
  const navigate = useNavigate();

  // Active diagnostic tab: 0 = Sentiment Math, 1 = Category & Tokens
  const [studioTab, setStudioTab] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isEditingQuote, setIsEditingQuote] = useState(false);

  // Surveys directory state
  const [submittedSurveys, setSubmittedSurveys] = useState([]);
  const [isFetchingSurveys, setIsFetchingSurveys] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const hasAutoSelectedRef = useRef(false);

  // Directory filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [filterCollege, setFilterCollege] = useState('All');
  const [datePreset, setDatePreset] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tablePage, setTablePage] = useState(1);

  // Pipeline inputs & snapshot of selected DB record
  const [inputText, setInputText] = useState(DEFAULT_SAMPLE_TEXT);
  const [ratings, setRatings] = useState(DEFAULT_RATINGS);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [originalSnapshot, setOriginalSnapshot] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);

  // Diagnostic execution state
  const [isLiveConnected, setIsLiveConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const abortControllerRef = useRef(null);

  // Execute diagnostic pipeline with AbortController to avoid out-of-order responses
  const executeExplainPipeline = useCallback(async (text, currentRatings, threshold) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    const payload = {
      text: text || '',
      ratings: currentRatings,
      threshold: threshold ?? 0.45,
    };

    try {
      let response;
      try {
        response = await axios.post('http://localhost:5001/api/debug/explain-scores', payload, {
          timeout: 3500,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setIsLiveConnected(true);
        }
      } catch (errDirect) {
        if (axios.isCancel(errDirect) || errDirect.name === 'CanceledError' || controller.signal.aborted) {
          return;
        }
        try {
          response = await axios.post('http://localhost:5000/api/debug/explain-scores', payload, {
            timeout: 3500,
            signal: controller.signal,
          });
          if (!controller.signal.aborted) {
            setIsLiveConnected(true);
          }
        } catch (errGateway) {
          if (axios.isCancel(errGateway) || errGateway.name === 'CanceledError' || controller.signal.aborted) {
            return;
          }
          throw new Error('ML endpoints offline');
        }
      }

      if (controller.signal.aborted) return;

      if (response && response.data) {
        setDiagnosticResult({ ...response.data, source: 'live_backend' });
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || controller.signal.aborted) {
        return;
      }
      setIsLiveConnected(false);
      setDiagnosticResult(runClientSimulation(text, currentRatings, threshold));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const applySurveyRecord = useCallback((survey) => {
    const sId = survey.Id || survey.id;
    const msg = survey.Message || '';
    const surveyRatings = [
      survey.Question1 || 'neutral',
      survey.Question2 || 'neutral',
      survey.Question3 || 'neutral',
      survey.Question4 || 'neutral',
      survey.Question5 || 'neutral',
      survey.Question6 || 'neutral',
      survey.Question7 || 'neutral',
      survey.Question8 || 'neutral',
      survey.Question9 || 'neutral',
      survey.Question10 || 'neutral',
    ];

    setSelectedSurveyId(sId);
    setSelectedMeta({
      id: sId,
      clientele: survey.Clientele || 'Patron',
      college: survey.College || 'General',
      course: survey.Course || '',
      dateSubmitted: survey.DateSubmitted || '',
      storedCategory: survey.Category || 'Other/Uncategorized',
      storedSentiment: survey.SentimentResult || 'Neutral',
      storedScore: survey.SentimentScore || 0.0,
    });
    setOriginalSnapshot({ text: msg, ratings: surveyRatings });
    setInputText(msg);
    setRatings(surveyRatings);
    setIsEditingQuote(false);
  }, []);

  // Fetch surveys once on mount and on manual reload — never on card selection
  const loadSubmittedSurveys = useCallback(async () => {
    setIsFetchingSurveys(true);
    setFetchError('');
    try {
      const res = await axios.get('http://localhost:5000/api/surveys', { timeout: 6000 });
      const data = Array.isArray(res.data) ? res.data : [];
      setSubmittedSurveys(data);

      const withComments = data.filter((s) => s.Message && s.Message.trim().length > 0);
      if (withComments.length > 0 && !hasAutoSelectedRef.current) {
        hasAutoSelectedRef.current = true;
        applySurveyRecord(withComments[0]);
      }
    } catch (err) {
      console.error('Failed to fetch submitted surveys:', err);
      setFetchError('Could not load surveys from port 5000.');
    } finally {
      setIsFetchingSurveys(false);
    }
  }, [applySurveyRecord]);

  useEffect(() => {
    loadSubmittedSurveys();
  }, [loadSubmittedSurveys]);

  // Debounced live calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      executeExplainPipeline(inputText, ratings, confidenceThreshold);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputText, ratings, confidenceThreshold, executeExplainPipeline]);

  const handleLoadScenario = useCallback((scenario) => {
    setSelectedSurveyId(null);
    setSelectedMeta(null);
    setOriginalSnapshot(null);
    setInputText(scenario.text);
    setRatings(scenario.ratings);
    setIsEditingQuote(false);
  }, []);

  const handleResetToOriginal = useCallback(() => {
    if (!originalSnapshot) return;
    setInputText(originalSnapshot.text);
    setRatings(originalSnapshot.ratings);
    setIsEditingQuote(false);
  }, [originalSnapshot]);

  const handleResetRatings = useCallback(() => {
    if (!originalSnapshot) return;
    setRatings(originalSnapshot.ratings);
  }, [originalSnapshot]);

  const handleRatingChange = useCallback((qIdx, newRatingId) => {
    setRatings((prev) => {
      const next = [...prev];
      next[qIdx] = newRatingId;
      return next;
    });
  }, []);

  const handleBulkRatingsChange = useCallback((ratingId) => {
    setRatings(Array(10).fill(ratingId));
  }, []);

  const isModified = useMemo(() => {
    if (!originalSnapshot) return false;
    if (inputText !== originalSnapshot.text) return true;
    return ratings.some((r, idx) => r !== originalSnapshot.ratings[idx]);
  }, [originalSnapshot, inputText, ratings]);

  const ratingsModified = useMemo(() => {
    if (!originalSnapshot) return false;
    return ratings.some((r, idx) => r !== originalSnapshot.ratings[idx]);
  }, [originalSnapshot, ratings]);

  const effectiveDateRange = useMemo(() => {
    if (customStartDate || customEndDate) {
      return {
        start: customStartDate ? new Date(`${customStartDate}T00:00:00`) : null,
        end: customEndDate ? new Date(`${customEndDate}T23:59:59.997`) : null,
      };
    }
    return getDatePresetRange(datePreset);
  }, [datePreset, customStartDate, customEndDate]);

  const commentsOnly = useMemo(
    () => submittedSurveys.filter((s) => s.Message && s.Message.trim().length > 0),
    [submittedSurveys]
  );

  const filteredComments = useMemo(() => {
    const { start, end } = effectiveDateRange;
    const lowerSearch = searchTerm.trim().toLowerCase();

    return commentsOnly.filter((s) => {
      if (lowerSearch) {
        const matchMsg = (s.Message || '').toLowerCase().includes(lowerSearch);
        const matchColl = (s.College || '').toLowerCase().includes(lowerSearch);
        const matchClient = (s.Clientele || '').toLowerCase().includes(lowerSearch);
        const matchId = String(s.Id || s.id || '').includes(lowerSearch);
        if (!matchMsg && !matchColl && !matchClient && !matchId) return false;
      }
      if (filterCategory !== 'All') {
        const storedCat = s.Category || 'Other/Uncategorized';
        if (storedCat !== filterCategory) return false;
      }
      if (filterSentiment !== 'All' && s.SentimentResult !== filterSentiment) return false;
      if (filterCollege !== 'All' && s.College !== filterCollege) return false;
      if (start || end) {
        const submitted = s.DateSubmitted ? new Date(s.DateSubmitted) : null;
        if (!submitted || Number.isNaN(submitted.getTime())) return false;
        if (start && submitted < start) return false;
        if (end && submitted > end) return false;
      }
      return true;
    });
  }, [commentsOnly, searchTerm, filterCategory, filterSentiment, filterCollege, effectiveDateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredComments.length / ROWS_PER_PAGE));
  const safeTablePage = Math.min(tablePage, totalPages);

  const paginatedComments = useMemo(() => {
    const start = (safeTablePage - 1) * ROWS_PER_PAGE;
    return filteredComments.slice(start, start + ROWS_PER_PAGE);
  }, [filteredComments, safeTablePage]);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterSentiment('All');
    setFilterCollege('All');
    setDatePreset('All Time');
    setCustomStartDate('');
    setCustomEndDate('');
    setTablePage(1);
  }, []);

  const statusColor =
    isLiveConnected === null
      ? '#94a3b8'
      : isLiveConnected
        ? THEME.status.success
        : THEME.brand.accent;

  const statusLabel =
    isLiveConnected === null
      ? 'Connecting…'
      : isLiveConnected
        ? 'Live ML (Port 5001)'
        : 'Local Simulation';

  return (
    <Header>
      {(toggleDrawer) => (
        <ThemeProvider theme={explainerTheme}>
          <Box sx={{ fontFamily: THEME.font.family }}>
            <TopBar onMenuClick={toggleDrawer} subtitle="AI Model Explainer Studio" />

            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: { xs: 2, md: 2.5 },
                bgcolor: THEME.surface.background,
                minHeight: 'calc(100vh - 90px)',
                overflowX: 'clip',
              }}
            >
              <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
                {/* Lightweight Borderless Header Strip */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    mb: 2.2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, flexWrap: 'wrap' }}>
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: { xs: 18, md: 20 },
                        fontWeight: 800,
                        color: THEME.text.primary,
                        letterSpacing: '-0.3px',
                      }}
                    >
                      Model Explainer
                    </Typography>

                    <Tooltip
                      title={
                        isLiveConnected
                          ? 'Connected to Flask RoBERTa & Naïve Bayes service on port 5001'
                          : 'Flask ML endpoint offline — using local mathematical simulation'
                      }
                      arrow
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.65,
                          px: 1.1,
                          py: 0.35,
                          borderRadius: '999px',
                          bgcolor: THEME.surface.card,
                          border: `1px solid ${THEME.surface.borderLight}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: statusColor,
                          }}
                        />
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: THEME.text.body }}>
                          {statusLabel}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setGuideOpen(true)}
                      sx={{
                        borderRadius: '9px',
                        height: 34,
                        px: 1.5,
                        fontSize: '0.76rem',
                        borderColor: THEME.surface.border,
                        color: THEME.brand.primary,
                        bgcolor: THEME.surface.card,
                        '&:hover': { borderColor: THEME.brand.primary, bgcolor: THEME.brand.blueLight },
                      }}
                    >
                      Guide
                    </Button>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DashboardIcon sx={{ fontSize: 16 }} />}
                      onClick={() => navigate('/sentiment-dashboard')}
                      sx={{
                        borderRadius: '9px',
                        height: 34,
                        px: 1.6,
                        fontSize: '0.76rem',
                        bgcolor: THEME.brand.primary,
                        color: '#ffffff',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: THEME.brand.primaryHover, boxShadow: 'none' },
                      }}
                    >
                      Dashboard
                    </Button>
                  </Stack>
                </Box>

                {/* Calm 2-Column Workbench */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '295px minmax(0, 1fr)',
                      lg: '320px minmax(0, 1fr)',
                      xl: '340px minmax(0, 1fr)',
                    },
                    gap: 2.5,
                    alignItems: 'start',
                  }}
                >
                  {/* Left Sticky Directory */}
                  <FeedbackDirectory
                    filteredComments={filteredComments}
                    paginatedComments={paginatedComments}
                    totalCommentsCount={commentsOnly.length}
                    isFetchingSurveys={isFetchingSurveys}
                    fetchError={fetchError}
                    onRetryFetch={loadSubmittedSurveys}
                    selectedSurveyId={selectedSurveyId}
                    onSelectSurvey={applySurveyRecord}
                    searchTerm={searchTerm}
                    onSearchChange={(val) => {
                      setSearchTerm(val);
                      setTablePage(1);
                    }}
                    filterCategory={filterCategory}
                    onCategoryChange={(val) => {
                      setFilterCategory(val);
                      setTablePage(1);
                    }}
                    filterSentiment={filterSentiment}
                    onSentimentChange={(val) => {
                      setFilterSentiment(val);
                      setTablePage(1);
                    }}
                    filterCollege={filterCollege}
                    onCollegeChange={(val) => {
                      setFilterCollege(val);
                      setTablePage(1);
                    }}
                    datePreset={datePreset}
                    onDatePresetChange={(val) => {
                      setDatePreset(val);
                      setTablePage(1);
                    }}
                    customStartDate={customStartDate}
                    onCustomStartDateChange={(val) => {
                      setCustomStartDate(val);
                      setTablePage(1);
                    }}
                    customEndDate={customEndDate}
                    onCustomEndDateChange={(val) => {
                      setCustomEndDate(val);
                      setTablePage(1);
                    }}
                    onClearAllFilters={handleClearAllFilters}
                    tablePage={safeTablePage}
                    rowsPerPage={ROWS_PER_PAGE}
                    onPageChange={setTablePage}
                  />

                  {/* Right Main Workspace: Only 2 Calm Cards */}
                  <Stack spacing={2.5} sx={{ minWidth: 0, width: '100%' }}>
                    {/* Card 1: Unified Statement + Sentiment/Category Verdict */}
                    <ExecutiveVerdict
                      inputText={inputText}
                      onInputTextChange={setInputText}
                      isEditingQuote={isEditingQuote}
                      onToggleEditQuote={() => setIsEditingQuote((prev) => !prev)}
                      selectedMeta={selectedMeta}
                      isModified={isModified}
                      onResetToOriginal={handleResetToOriginal}
                      onLoadScenario={handleLoadScenario}
                      isLoading={isLoading}
                      diagnosticResult={diagnosticResult}
                      confidenceThreshold={confidenceThreshold}
                    />

                    {/* Card 2: Progressive-Disclosure Breakdown Tabs */}
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: THEME.surface.card,
                        border: `1px solid ${THEME.surface.borderLight}`,
                        borderRadius: '14px',
                        boxShadow: '0 1px 4px rgba(22, 50, 79, 0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      <Tabs
                        value={studioTab}
                        onChange={(e, val) => setStudioTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        aria-label="Score breakdown tracks"
                        sx={{
                          px: { xs: 1.5, md: 2.5 },
                          borderBottom: `1px solid ${THEME.surface.borderLight}`,
                          '& .MuiTabs-indicator': {
                            height: 2.5,
                            bgcolor: THEME.brand.primary,
                          },
                          '& .MuiTab-root': {
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            py: 1.5,
                            minHeight: 48,
                            color: THEME.text.secondary,
                            '&.Mui-selected': {
                              color: THEME.brand.primary,
                            },
                          },
                        }}
                      >
                        <Tab label="Sentiment Breakdown" />
                        <Tab label="Category & Tokens" />
                      </Tabs>

                      <Box sx={{ p: { xs: 2.2, md: 2.8 } }}>
                        {studioTab === 0 && (
                          <SentimentSynthesisTab
                            diagnosticResult={diagnosticResult}
                            ratings={ratings}
                            onRatingChange={handleRatingChange}
                            onBulkRatingsChange={handleBulkRatingsChange}
                            canResetRatings={ratingsModified}
                            onResetRatings={handleResetRatings}
                          />
                        )}

                        {studioTab === 1 && (
                          <CategoryClassificationTab
                            inputText={inputText}
                            diagnosticResult={diagnosticResult}
                            confidenceThreshold={confidenceThreshold}
                            onConfidenceThresholdChange={setConfidenceThreshold}
                          />
                        )}
                      </Box>
                    </Paper>
                  </Stack>
                </Box>
              </Box>
            </Box>

            {/* Slide-Over Scoring Reference Guide */}
            <ReferenceGuideDrawer
              open={guideOpen}
              onClose={() => setGuideOpen(false)}
              alpha={diagnosticResult?.naive_bayes?.alpha ?? 0.01}
              confidenceThreshold={confidenceThreshold}
            />
          </Box>
        </ThemeProvider>
      )}
    </Header>
  );
}
