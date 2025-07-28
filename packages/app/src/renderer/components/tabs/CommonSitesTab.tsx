import React, { useState, useMemo } from 'react';
import {
  Stack,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

interface CommonSite {
  name: string;
  category: 'BROKER' | 'PROP FIRM' | 'PLATFORM';
}

const COMMON_SITES: CommonSite[] = [
  // PROP FIRMS
  { name: 'topstep.com', category: 'PROP FIRM' },
  { name: 'topsteptrader.com', category: 'PROP FIRM' },
  { name: 'ftmo.com', category: 'PROP FIRM' },
  { name: 'apextrader.com', category: 'PROP FIRM' },
  { name: 'myforexfunds.com', category: 'PROP FIRM' },
  { name: 'the5ers.com', category: 'PROP FIRM' },
  { name: 'takeprofittrader.com', category: 'PROP FIRM' },
  // PLATFORMS
  { name: 'tradingview.com', category: 'PLATFORM' },
  { name: 'ninjatrader.com', category: 'PLATFORM' },
  { name: 'thinkorswim.com', category: 'PLATFORM' },
  { name: 'webull.com', category: 'PLATFORM' },
  { name: 'robinhood.com', category: 'PLATFORM' },
  { name: 'tradovate.com', category: 'PLATFORM' },
  // BROKERS
  { name: 'tdameritrade.com', category: 'BROKER' },
  { name: 'etrade.com', category: 'BROKER' },
  { name: 'schwab.com', category: 'BROKER' },
  { name: 'fidelity.com', category: 'BROKER' },
  { name: 'interactivebrokers.com', category: 'BROKER' }
];

interface BlockRule {
  id: string;
  name: string;
  urlPatterns: string[];
  enabled: boolean;
  createdAt: string;
}

interface CommonSitesTabProps {
  loading: boolean;
  onAddUrl: (url: string) => void;
  newUrl: string;
  onUrlChange: (url: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  error: string | null;
  rules: BlockRule[];
  onClearError: () => void;
}

const CommonSitesTab: React.FC<CommonSitesTabProps> = ({
  loading,
  onAddUrl,
  newUrl,
  onUrlChange,
  onDeleteRule,
  onKeyPress,
  error,
  rules,
  onClearError
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter common sites based on search
  const filteredSites = useMemo(() => {
    if (!searchQuery) return COMMON_SITES;
    return COMMON_SITES.filter(site => 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Check if a site is already blocked
  const isBlocked = (siteName: string) => {
    return rules.some(rule => 
      rule.urlPatterns.some(pattern => pattern.includes(siteName))
    );
  };

  // Get the rule ID for a blocked site
  const getBlockedRuleId = (siteName: string) => {
    const rule = rules.find(rule => 
      rule.urlPatterns.some(pattern => pattern.includes(siteName))
    );
    return rule?.id;
  };

  // Toggle a site between blocked and unblocked
  const handleToggleSite = (siteName: string) => {
    if (isBlocked(siteName)) {
      // Site is blocked, remove it
      const ruleId = getBlockedRuleId(siteName);
      if (ruleId) {
        onDeleteRule(ruleId);
      }
    } else {
      // Site is not blocked, add it
      onAddUrl(siteName);
    }
  };



  const handleAddCustomSite = () => {
    if (newUrl.trim()) {
      onAddUrl(newUrl);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Add Custom Site Section */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <LanguageIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.125rem' }}>
            Add Custom Site
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter website URL (e.g., example.com)"
            value={newUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyPress={onKeyPress}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
                '& fieldset': {
                  border: '2px solid #E2E8F0',
                },
                '&:hover fieldset': {
                  borderColor: '#3B82F6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3B82F6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddCustomSite}
            disabled={loading || !newUrl.trim()}
            sx={{
              borderRadius: '12px',
              fontWeight: 500,
              textTransform: 'none',
              backgroundColor: '#3B82F6',
              px: 3,
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#2563EB',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Add
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            onClose={onClearError}
            sx={{
              backgroundColor: '#FEF2F2',
              borderLeft: '4px solid #EF4444',
              borderRadius: '12px',
              mb: 2,
            }}
          >
            {error}
          </Alert>
        )}

        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px', mb: 3 }}>
          Add any website to your blocklist. These sites will be blocked during lockout periods.
        </Typography>
      </Box>

      {/* Common Trading Sites Section */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <TrendingUpIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.125rem' }}>
            Common Trading Sites
          </Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              fontSize: '14px',
              '& fieldset': {
                border: '2px solid #E2E8F0',
              },
              '&:hover fieldset': {
                borderColor: '#3B82F6',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3B82F6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
              },
            },
          }}
        />

        <Box 
          display="grid" 
          gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" 
          gap={1.5}
          sx={{ mb: 3 }}
        >
          {filteredSites.map((site) => (
            <Card
              key={site.name}
              onClick={() => handleToggleSite(site.name)}
              sx={{
                cursor: 'pointer',
                border: '2px solid #E2E8F0',
                borderRadius: '12px',
                position: 'relative',
                transition: 'all 0.2s ease',
                ...(isBlocked(site.name) ? {
                  background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                  color: '#FFFFFF',
                  borderColor: '#3B82F6'
                } : {
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B'
                }),
                '&:hover': {
                  borderColor: '#3B82F6',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                },
                ...(isBlocked(site.name) && {
                  '&::after': {
                    content: '"✓"',
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }
                })
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '14px',
                    color: 'inherit'
                  }}
                >
                  {site.name}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Current Blocklist Section */}
      <Box>
        <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.125rem', mb: 2 }}>
          🚫 Current Blocklist ({rules.length})
        </Typography>

        {rules.length === 0 ? (
          <Box 
            textAlign="center" 
            sx={{ 
              py: 5,
              color: '#64748B'
            }}
          >
            <Typography>No sites blocked yet</Typography>
          </Box>
        ) : (
          <Box 
            sx={{ 
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              p: 2.5
            }}
          >
            {rules.map((rule) => (
              <Box
                key={rule.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  p: 2,
                  mb: 1,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  '&:last-child': { mb: 0 }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B', mb: 0.25 }}>
                    {rule.urlPatterns && rule.urlPatterns.length > 0 ? rule.urlPatterns[0] : rule.name || 'Unknown URL'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '12px' }}>
                    Added {new Date(rule.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => onDeleteRule(rule.id)}
                  size="small"
                  sx={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    width: 32,
                    height: 32,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: 1,
                    '&:hover': {
                      backgroundColor: '#DC2626',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  🗑️
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default CommonSitesTab; 