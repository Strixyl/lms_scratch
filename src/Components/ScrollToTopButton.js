import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Tooltip, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  // Calculate scroll position and progress
  const calculateScroll = useCallback(() => {
    // 1. Check window/document scroll
    const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const windowScrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    // 2. Check any scrolled inner container
    let maxElementScrollTop = 0;
    let maxElementProgress = 0;

    const scrollContainers = document.querySelectorAll('*');
    scrollContainers.forEach((el) => {
      if (el.scrollHeight > el.clientHeight && el.scrollTop > 0) {
        const computed = window.getComputedStyle(el);
        if (computed.overflowY === 'auto' || computed.overflowY === 'scroll') {
          if (el.scrollTop > maxElementScrollTop) {
            maxElementScrollTop = el.scrollTop;
            const diff = el.scrollHeight - el.clientHeight;
            maxElementProgress = diff > 0 ? (el.scrollTop / diff) * 100 : 0;
          }
        }
      }
    });

    const activeScrollTop = Math.max(windowScrollTop, maxElementScrollTop);
    const calculatedProgress = windowScrollHeight > 0
      ? (windowScrollTop / windowScrollHeight) * 100
      : maxElementProgress;

    setScrollProgress(Math.min(100, Math.max(0, calculatedProgress)));
    setIsVisible(activeScrollTop > 200);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use capture: true so scroll events on inner containers are also captured
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    // Initial check
    calculateScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [calculateScroll]);

  // When route changes, scroll to top and reset state
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsVisible(false);
    setScrollProgress(0);
  }, [location.pathname]);

  const scrollToTop = () => {
    // Smoothly scroll the window
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    document.body.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Smoothly scroll any inner scroll containers
    const scrollContainers = document.querySelectorAll('*');
    scrollContainers.forEach((el) => {
      if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight) {
        const computed = window.getComputedStyle(el);
        if (computed.overflowY === 'auto' || computed.overflowY === 'scroll') {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  };

  // Circular progress calculations
  const size = 52;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <Zoom in={isVisible} unmountOnExit timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@media print': {
            display: 'none !important',
          },
        }}
      >
        <Tooltip
          title={`Back to top (${Math.round(scrollProgress)}%)`}
          placement="left"
          arrow
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: '#0d1b3e',
                color: '#f8fafc',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                px: 1.5,
                py: 0.8,
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                border: '1px solid rgba(246, 157, 27, 0.4)',
                '& .MuiTooltip-arrow': {
                  color: '#0d1b3e',
                },
              },
            },
          }}
        >
          <Box
            component="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            sx={{
              position: 'relative',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #16324f 0%, #0d1b3e 100%)',
              boxShadow: '0 8px 24px rgba(13, 27, 62, 0.35), 0 2px 8px rgba(246, 157, 27, 0.25)',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                transform: 'translateY(-4px) scale(1.08)',
                boxShadow: '0 12px 30px rgba(246, 157, 27, 0.45), 0 4px 14px rgba(13, 27, 62, 0.45)',
                '& .scroll-arrow-icon': {
                  transform: 'translateY(-2px)',
                },
                '& .progress-circle': {
                  filter: 'drop-shadow(0 0 4px rgba(246, 157, 27, 0.8))',
                },
              },
              '&:active': {
                transform: 'translateY(0px) scale(0.95)',
                boxShadow: '0 4px 12px rgba(13, 27, 62, 0.3)',
              },
              '&:focus-visible': {
                boxShadow: '0 0 0 3px rgba(246, 157, 27, 0.6), 0 8px 24px rgba(13, 27, 62, 0.35)',
              },
            }}
          >
            {/* SVG Progress Ring */}
            <svg
              width={size}
              height={size}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'rotate(-90deg)',
                pointerEvents: 'none',
              }}
            >
              {/* Background Track Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={strokeWidth}
              />
              {/* Animated Progress Indicator Ring */}
              <circle
                className="progress-circle"
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#f69d1b"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 160ms cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease',
                }}
              />
            </svg>

            {/* Inner Gold Arrow Icon */}
            <KeyboardArrowUpIcon
              className="scroll-arrow-icon"
              sx={{
                color: '#f69d1b',
                fontSize: 28,
                transition: 'transform 0.2s ease',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
              }}
            />
          </Box>
        </Tooltip>
      </Box>
    </Zoom>
  );
};

export default ScrollToTopButton;
