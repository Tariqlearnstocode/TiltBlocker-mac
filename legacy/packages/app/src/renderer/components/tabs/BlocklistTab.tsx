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
  Chip,
  Pagination
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { COMMON_SITES } from '../../data/commonSites';

interface BlockRule {
  id: string;
  name: string;
  urlPatterns: string[];
  enabled: boolean;
  createdAt: string;
}

interface BlocklistTabProps {
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

const BlocklistTab: React.FC<BlocklistTabProps & {
  onAddMultipleUrls: (urls: string[]) => void;
  onClearAllRules: () => void;
}> = ({
  loading,
  onAddUrl,
  newUrl,
  onUrlChange,
  onDeleteRule,
  onKeyPress,
  error,
  rules,
  onClearError,
  onAddMultipleUrls,
  onClearAllRules
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PROP FIRM' | 'BROKER' | 'PLATFORM'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [blocklistPage, setBlocklistPage] = useState(1);
  const SITES_PER_PAGE = 50;
  const BLOCKLIST_PER_PAGE = 20;

  // Pre-compute blocked domains for efficient lookups
  const blockedDomains = useMemo(() => {
    const set = new Set<string>();
    rules.forEach(rule => {
      (rule.urlPatterns || []).forEach(pattern => {
        if (pattern) {
          set.add(pattern.trim().toLowerCase());
        }
      });
    });
    return set;
  }, [rules]);

  // Check if a site is already blocked
  const isBlocked = (siteName: string) => {
    return blockedDomains.has(siteName.trim().toLowerCase());
  };

  // Filter common sites based on search and category
  const filteredSites = useMemo(() => {
    let sites = COMMON_SITES;
    
    // Apply category filter
    if (categoryFilter !== 'ALL') {
      sites = sites.filter(site => site.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      sites = sites.filter(site => 
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return sites;
  }, [searchQuery, categoryFilter]);

  // Paginate filtered sites
  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * SITES_PER_PAGE;
    const endIndex = startIndex + SITES_PER_PAGE;
    return filteredSites.slice(startIndex, endIndex);
  }, [filteredSites, currentPage]);

  const totalPages = Math.ceil(filteredSites.length / SITES_PER_PAGE);

  // Paginate blocklist
  const paginatedBlocklist = useMemo(() => {
    const startIndex = (blocklistPage - 1) * BLOCKLIST_PER_PAGE;
    const endIndex = startIndex + BLOCKLIST_PER_PAGE;
    return rules.slice(startIndex, endIndex);
  }, [rules, blocklistPage]);

  const totalBlocklistPages = Math.ceil(rules.length / BLOCKLIST_PER_PAGE);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSites = COMMON_SITES.length;
    const blockedSites = COMMON_SITES.filter(site => isBlocked(site.name)).length;
    const propFirms = COMMON_SITES.filter(s => s.category === 'PROP FIRM');
    const brokers = COMMON_SITES.filter(s => s.category === 'BROKER');
    const platforms = COMMON_SITES.filter(s => s.category === 'PLATFORM');
    
    return {
      total: totalSites,
      blocked: blockedSites,
      percentage: Math.round((blockedSites / totalSites) * 100),
      propFirms: {
        total: propFirms.length,
        blocked: propFirms.filter(s => isBlocked(s.name)).length
      },
      brokers: {
        total: brokers.length,
        blocked: brokers.filter(s => isBlocked(s.name)).length
      },
      platforms: {
        total: platforms.length,
        blocked: platforms.filter(s => isBlocked(s.name)).length
      }
    };
  }, [rules]);

  // Get the rule ID for a blocked site
  const getBlockedRuleId = (siteName: string) => {
    const normalized = siteName.trim().toLowerCase();
    const rule = rules.find(rule => 
      (rule.urlPatterns || []).some(pattern => pattern.trim().toLowerCase() === normalized)
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

  // Add all common sites to blocklist
  const handleAddAll = () => {
    const sitesToAdd = COMMON_SITES
      .filter(site => !isBlocked(site.name))
      .map(site => site.name);
    if (sitesToAdd.length === 0) return;
    onAddMultipleUrls(sitesToAdd);
  };

  // Check how many sites are not yet blocked
  const unblockedCount = useMemo(() => {
    return COMMON_SITES.filter(site => !isBlocked(site.name)).length;
  }, [rules]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery]);

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

        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
          Add any website to your blocklist. These sites will be blocked during lockout periods.
        </Typography>
      </Box>

      {/* Common Trading Sites Section */}
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUpIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
            <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.125rem' }}>
              Common Trading Sites
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {unblockedCount > 0 && (
              <Button
                variant="contained"
                onClick={handleAddAll}
                disabled={loading}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 500,
                  textTransform: 'none',
                  backgroundColor: '#3B82F6',
                  px: 2.5,
                  py: 0.75,
                  color: '#FFFFFF',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#2563EB',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Block All ({unblockedCount})
              </Button>
            )}
            {rules.length > 0 && (
              <Button
                variant="outlined"
                onClick={onClearAllRules}
                disabled={loading}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderColor: '#E11D48',
                  color: '#E11D48',
                  px: 2.5,
                  py: 0.75,
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#BE123C',
                    backgroundColor: '#FEF2F2',
                  },
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>

        {/* Category Filter Chips */}
        <Box display="flex" gap={1.5} sx={{ mb: 2 }} flexWrap="wrap">
          {(['ALL', 'PROP FIRM', 'BROKER', 'PLATFORM'] as const).map((category) => (
            <Chip
              key={category}
              label={category === 'ALL' ? `All (${stats.total})` : 
                     category === 'PROP FIRM' ? `💼 Prop Firms (${stats.propFirms.total})` :
                     category === 'BROKER' ? `🏦 Brokers (${stats.brokers.total})` :
                     `📊 Platforms (${stats.platforms.total})`}
              onClick={() => setCategoryFilter(category)}
              sx={{
                fontWeight: 500,
                fontSize: '13px',
                px: 1,
                transition: 'all 0.2s ease',
                ...(categoryFilter === category ? {
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#2563EB',
                  }
                } : {
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  '&:hover': {
                    backgroundColor: '#E2E8F0',
                    color: '#3B82F6',
                  }
                })
              }}
            />
          ))}
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
          gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))" 
          gap={1.5}
          sx={{ mb: 2 }}
        >
          {paginatedSites.map((site) => {
            const blocked = isBlocked(site.name);
            
            return (
              <Card
                key={site.name}
                onClick={() => handleToggleSite(site.name)}
                sx={{
                  cursor: 'pointer',
                  border: `2px solid ${blocked ? '#3B82F6' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  backgroundColor: blocked ? '#F0F9FF' : '#FFFFFF',
                  '&:hover': {
                    borderColor: '#3B82F6',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '13px',
                        color: '#1E293B',
                        wordBreak: 'break-word',
                        flex: 1
                      }}
                    >
                      {site.name}
                    </Typography>
                    {blocked && (
                      <Box sx={{
                        backgroundColor: '#3B82F6',
                        color: '#FFFFFF',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        ✓
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {filteredSites.length === 0 && (
          <Box 
            textAlign="center" 
            sx={{ 
              py: 5,
              color: '#64748B'
            }}
          >
            <Typography>No sites found matching your search</Typography>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Showing {((currentPage - 1) * SITES_PER_PAGE) + 1}-{Math.min(currentPage * SITES_PER_PAGE, filteredSites.length)} of {filteredSites.length} sites
            </Typography>
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '8px',
                  fontWeight: 500,
                },
                '& .Mui-selected': {
                  backgroundColor: '#3B82F6 !important',
                  color: '#FFFFFF',
                }
              }}
            />
          </Box>
        )}
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
          <>
            <Box 
              sx={{ 
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                p: 2.5
              }}
            >
              {paginatedBlocklist.map((rule) => (
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

            {/* Blocklist Pagination */}
            {totalBlocklistPages > 1 && (
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Showing {((blocklistPage - 1) * BLOCKLIST_PER_PAGE) + 1}-{Math.min(blocklistPage * BLOCKLIST_PER_PAGE, rules.length)} of {rules.length} blocked sites
                </Typography>
                <Pagination 
                  count={totalBlocklistPages} 
                  page={blocklistPage} 
                  onChange={(_, page) => setBlocklistPage(page)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '8px',
                      fontWeight: 500,
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#3B82F6 !important',
                      color: '#FFFFFF',
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
};

export default BlocklistTab;

