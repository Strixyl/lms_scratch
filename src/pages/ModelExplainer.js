import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Tooltip,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
  Calculate as CalculateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Science as ScienceIcon,
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  MenuBook as MenuBookIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { THEME, cardShellSx } from '../constants/themeTokens';

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
const ROWS_PER_PAGE = 8;

export default function ModelExplainer() {
  const navigate = useNavigate();

  // Active diagnostic tab: 0 = Hybrid Sentiment (Track 2), 1 = Category Naive Bayes (Track 1)
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

  // Pipeline inputs & snapshot of selected DB record (to detect What-If edits)
  const [inputText, setInputText] = useState(DEFAULT_SAMPLE_TEXT);
  const [ratings, setRatings] = useState(DEFAULT_RATINGS);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [originalSnapshot, setOriginalSnapshot] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Diagnostic execution state
  const [isLiveConnected, setIsLiveConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const abortControllerRef = useRef(null);

  // Execute diagnostic pipeline with AbortController so stale requests never overwrite fresh state
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
          throw new Error('Both Python (5001) and Node Gateway (5000) are offline.');
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
      const simulated = runClientSimulation(text, currentRatings, threshold);
      setDiagnosticResult(simulated);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Abort any in-flight explain request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Apply a selected survey record into the diagnostic workbench
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

    return { msg, surveyRatings };
  }, []);

  // Fetch submitted surveys (runs once on mount and on manual Refresh — never on card clicks)
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
      setFetchError('Could not load patron surveys from port 5000.');
    } finally {
      setIsFetchingSurveys(false);
    }
  }, [applySurveyRecord]);

  useEffect(() => {
    loadSubmittedSurveys();
  }, [loadSubmittedSurveys]);

  // Auto-recalculate with debounce whenever inputs change
  useEffect(() => {
    if (!autoCalculate) return undefined;
    const timer = setTimeout(() => {
      executeExplainPipeline(inputText, ratings, confidenceThreshold);
    }, 220);
    return () => clearTimeout(timer);
  }, [inputText, ratings, confidenceThreshold, autoCalculate, executeExplainPipeline]);

  const handleSelectSubmittedComment = useCallback(
    (survey) => {
      const { msg, surveyRatings } = applySurveyRecord(survey);
      if (!autoCalculate) {
        executeExplainPipeline(msg, surveyRatings, confidenceThreshold);
      }
    },
    [applySurveyRecord, autoCalculate, confidenceThreshold, executeExplainPipeline]
  );

  const handleLoadScenario = useCallback(
    (scenario) => {
      setSelectedSurveyId(null);
      setSelectedMeta(null);
      setOriginalSnapshot(null);
      setInputText(scenario.text);
      setRatings(scenario.ratings);
      setIsEditingQuote(false);
      if (!autoCalculate) {
        executeExplainPipeline(scenario.text, scenario.ratings, confidenceThreshold);
      }
    },
    [autoCalculate, confidenceThreshold, executeExplainPipeline]
  );

  const handleResetToOriginal = useCallback(() => {
    if (!originalSnapshot) return;
    setInputText(originalSnapshot.text);
    setRatings(originalSnapshot.ratings);
    setIsEditingQuote(false);
    if (!autoCalculate) {
      executeExplainPipeline(originalSnapshot.text, originalSnapshot.ratings, confidenceThreshold);
    }
  }, [originalSnapshot, autoCalculate, confidenceThreshold, executeExplainPipeline]);

  const handleResetRatings = useCallback(() => {
    if (!originalSnapshot) return;
    setRatings(originalSnapshot.ratings);
    if (!autoCalculate) {
      executeExplainPipeline(inputText, originalSnapshot.ratings, confidenceThreshold);
    }
  }, [originalSnapshot, autoCalculate, inputText, confidenceThreshold, executeExplainPipeline]);

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

  // Track whether current inputs diverge from the selected database record
  const isModified = useMemo(() => {
    if (!originalSnapshot) return false;
    if (inputText !== originalSnapshot.text) return true;
    return ratings.some((r, idx) => r !== originalSnapshot.ratings[idx]);
  }, [originalSnapshot, inputText, ratings]);

  const ratingsModified = useMemo(() => {
    if (!originalSnapshot) return false;
    return ratings.some((r, idx) => r !== originalSnapshot.ratings[idx]);
  }, [originalSnapshot, ratings]);

  // Directory date filtering
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

  return (
    <Header>
      {(toggleDrawer) => (
        <ThemeProvider theme={explainerTheme}>
          <Box sx={{ fontFamily: THEME.font.family }}>
            <TopBar
              onMenuClick={toggleDrawer}
              subtitle="AI Model Explainer Studio"
            />

            <Box
              sx={{
                p: { xs: 1.8, md: 2.5 },
                bgcolor: THEME.surface.background,
                minHeight: 'calc(100vh - 90px)',
                overflowX: 'clip',
              }}
            >
              {/* Slim Studio Toolbar */}
              <Paper
                elevation={0}
                sx={{
                  ...cardShellSx,
                  borderTop: `3.5px solid ${THEME.brand.accent}`,
                  px: { xs: 2, md: 2.4 },
                  py: 1.6,
                  mb: 2.2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.6,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: { xs: 17.5, md: 20 },
                        fontWeight: 800,
                        color: THEME.text.primary,
                        letterSpacing: '-0.3px',
                        lineHeight: 1.25,
                      }}
                    >
                      Sentiment &amp; Naïve Bayes Score Breakdown
                    </Typography>

                    <Tooltip
                      title={
                        isLiveConnected === null
                          ? 'Connecting to local Flask NLP microservice'
                          : isLiveConnected
                            ? 'Connected directly to live CardiffNLP RoBERTa + Naïve Bayes microservice (Port 5001)'
                            : 'Flask/Express ML endpoint offline — using local mathematical fallback simulation'
                      }
                      arrow
                    >
                      <Chip
                        icon={
                          isLiveConnected === null ? (
                            <SyncIcon sx={{ fontSize: '0.95rem !important', color: `${THEME.brand.primary} !important` }} />
                          ) : isLiveConnected ? (
                            <CheckCircleIcon sx={{ fontSize: '0.95rem !important', color: `${THEME.status.success} !important` }} />
                          ) : (
                            <WarningIcon sx={{ fontSize: '0.95rem !important', color: `${THEME.brand.accent} !important` }} />
                          )
                        }
                        label={
                          isLiveConnected === null
                            ? 'Connecting...'
                            : isLiveConnected
                              ? 'Live ML · Port 5001'
                              : 'Simulation Fallback'
                        }
                        size="small"
                        sx={{
                          height: 24,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          bgcolor:
                            isLiveConnected === null
                              ? THEME.brand.blueLight
                              : isLiveConnected
                                ? THEME.status.successLight
                                : THEME.brand.goldLight,
                          color:
                            isLiveConnected === null
                              ? THEME.brand.primary
                              : isLiveConnected
                                ? THEME.status.success
                                : '#c2410c',
                          border: `1px solid ${
                            isLiveConnected === null
                              ? THEME.brand.blueBorder
                              : isLiveConnected
                                ? THEME.status.successBorder
                                : THEME.brand.goldBorder
                          }`,
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Typography sx={{ fontSize: 12.5, color: THEME.text.secondary, fontWeight: 500, mt: 0.25 }}>
                    Inspect live survey records or edit statements and Likert ratings to trace scoring step by step.
                  </Typography>
                </Box>

                {/* Primary Toolbar Actions */}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setGuideOpen(true)}
                    sx={{
                      borderRadius: '10px',
                      height: 36,
                      px: 1.6,
                      fontSize: 12.5,
                      borderColor: THEME.brand.blueBorder,
                      color: THEME.brand.primary,
                      bgcolor: THEME.brand.blueLight,
                      borderWidth: '1.5px',
                      '&:hover': {
                        borderColor: THEME.brand.primary,
                        bgcolor: '#dbe7f3',
                        borderWidth: '1.5px',
                      },
                    }}
                  >
                    Scoring Guide
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                    onClick={loadSubmittedSurveys}
                    disabled={isFetchingSurveys}
                    sx={{
                      borderRadius: '10px',
                      height: 36,
                      px: 1.5,
                      fontSize: 12.5,
                      borderColor: THEME.surface.border,
                      color: THEME.brand.primary,
                      bgcolor: THEME.surface.card,
                      borderWidth: '1.5px',
                      '&:hover': {
                        borderColor: THEME.brand.primary,
                        bgcolor: THEME.brand.blueLight,
                        borderWidth: '1.5px',
                      },
                    }}
                  >
                    {isFetchingSurveys ? 'Refreshing...' : 'Refresh'}
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DashboardIcon sx={{ fontSize: 16 }} />}
                    onClick={() => navigate('/sentiment-dashboard')}
                    sx={{
                      borderRadius: '10px',
                      height: 36,
                      px: 1.8,
                      fontSize: 12.5,
                      bgcolor: THEME.brand.primary,
                      color: '#ffffff',
                      boxShadow: '0 2px 6px rgba(22, 50, 79, 0.2)',
                      '&:hover': { bgcolor: THEME.brand.primaryHover },
                    }}
                  >
                    Sentiment Dashboard
                  </Button>
                </Stack>
              </Paper>

              {/* Main 2-Column Workbench */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '330px minmax(0, 1fr)',
                    lg: '370px minmax(0, 1fr)',
                    xl: '400px minmax(0, 1fr)',
                  },
                  gap: 2.2,
                  width: '100%',
                  alignItems: 'start',
                }}
              >
                {/* Left Sticky Feedback Directory */}
                <FeedbackDirectory
                  filteredComments={filteredComments}
                  paginatedComments={paginatedComments}
                  totalCommentsCount={commentsOnly.length}
                  isFetchingSurveys={isFetchingSurveys}
                  fetchError={fetchError}
                  onRetryFetch={loadSubmittedSurveys}
                  selectedSurveyId={selectedSurveyId}
                  onSelectSurvey={handleSelectSubmittedComment}
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

                {/* Right Diagnostic Studio */}
                <Stack spacing={2.2} sx={{ minWidth: 0, width: '100%' }}>
                  {/* Active Quote (Inline Highlighted / Editable What-If) + Unified 4-KPI Verdict */}
                  <ExecutiveVerdict
                    inputText={inputText}
                    onInputTextChange={setInputText}
                    isEditingQuote={isEditingQuote}
                    onToggleEditQuote={() => setIsEditingQuote((prev) => !prev)}
                    selectedMeta={selectedMeta}
                    isModified={isModified}
                    onResetToOriginal={handleResetToOriginal}
                    onLoadScenario={handleLoadScenario}
                    autoCalculate={autoCalculate}
                    onAutoCalculateChange={setAutoCalculate}
                    onRunPipeline={() =>
                      executeExplainPipeline(inputText, ratings, confidenceThreshold)
                    }
                    isLoading={isLoading}
                    diagnosticResult={diagnosticResult}
                    confidenceThreshold={confidenceThreshold}
                  />

                  {/* Deep-Dive Pipeline Tabs */}
                  <Paper elevation={0} sx={{ ...cardShellSx }}>
                    <Tabs
                      value={studioTab}
                      onChange={(e, val) => setStudioTab(val)}
                      variant="scrollable"
                      scrollButtons="auto"
                      allowScrollButtonsMobile
                      aria-label="Diagnostic pipeline tracks"
                      textColor="primary"
                      indicatorColor="primary"
                      sx={{
                        px: { xs: 1, md: 2 },
                        borderBottom: `1px solid ${THEME.surface.borderLight}`,
                        bgcolor: THEME.surface.cardAlt,
                        '& .MuiTabs-indicator': {
                          height: 3,
                          borderRadius: '3px 3px 0 0',
                          bgcolor: THEME.brand.primary,
                        },
                        '& .MuiTab-root': {
                          fontSize: '0.84rem',
                          py: 1.5,
                          minHeight: 50,
                          color: THEME.text.secondary,
                          '&.Mui-selected': {
                            color: THEME.brand.primary,
                          },
                        },
                      }}
                    >
                      <Tab
                        icon={<CalculateIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        label="Hybrid Sentiment Synthesis (Track 2)"
                      />
                      <Tab
                        icon={<ScienceIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                        label="Category Classification — Naïve Bayes (Track 1)"
                      />
                    </Tabs>

                    <Box sx={{ p: { xs: 1.8, md: 2.4 } }}>
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

            {/* Slide-Over Model Reference Guide Drawer */}
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
