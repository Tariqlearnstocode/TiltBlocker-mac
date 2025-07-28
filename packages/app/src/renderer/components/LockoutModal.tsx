import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Stack,
  Grid,
  Box,
  TextField,
  IconButton,
  Chip
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
// Trading session utilities - temporarily inline until import is fixed
const TRADING_SESSIONS = {
  'NEW_YORK': { name: 'New York Session', startHour: 7, endHour: 16 },
  'LONDON': { name: 'London Session', startHour: 2, endHour: 11 },
  'TOKYO': { name: 'Tokyo Session', startHour: 18, endHour: 3 },
  'SYDNEY': { name: 'Sydney Session', startHour: 16, endHour: 1 }
};

const isSessionAvailable = (sessionKey: string): boolean => {
  const now = new Date();
  const day = now.getDay();
  
  // Simple availability check - weekdays for NY/London, Sun-Thu for Tokyo/Sydney
  if (sessionKey === 'NEW_YORK' || sessionKey === 'LONDON') {
    return day >= 1 && day <= 5;
  }
  return day >= 0 && day <= 4;
};

const formatSessionTime = (sessionKey: string): string => {
  const session = TRADING_SESSIONS[sessionKey as keyof typeof TRADING_SESSIONS];
  if (!session) return '';
  
  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return '12pm';
    return `${hour - 12}pm`;
  };
  
  return `(${formatHour(session.startHour)}-${formatHour(session.endHour)} CT)`;
};

interface LockoutModalProps {
  open: boolean;
  onClose: () => void;
  onSettingsClick: () => void;
  onConfirm: () => void;
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  customDuration: { hours: number; minutes: number };
  onCustomDurationChange: (duration: { hours: number; minutes: number }) => void;
  blockedSites: string[];
  selectedSession?: string;
  onSessionChange?: (session: string) => void;
}

const LockoutModal: React.FC<LockoutModalProps> = ({
  open,
  onClose,
  onSettingsClick,
  onConfirm,
  selectedDuration,
  onDurationChange,
  customDuration,
  onCustomDurationChange,
  blockedSites,
  selectedSession,
  onSessionChange
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(27, 31, 59, 0.1)',
          border: 'none',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', paddingBottom: '8px', paddingTop: '24px' }}>
        <Typography variant="h5" fontWeight="600" sx={{ color: '#1B1F3B', fontSize: '1.5rem' }}>
          Confirm Trading <span style={{ color: '#FF4757' }}>Lock-Out?</span>
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ 
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <Typography variant="subtitle2" sx={{ 
            color: '#64748B',
            marginBottom: '12px',
            fontWeight: 500
          }}>
            <span
              style={{ cursor: 'pointer' }}
              onClick={onSettingsClick}
              tabIndex={0}
              role="button"
              aria-label="Go to blocklist"
              onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') onSettingsClick();
              }}
            >
              Blocklist:
            </span>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start', alignItems: 'flex-start' }}>
            {blockedSites.map((site, index) => (
              <Chip
                key={index}
                label={site}
                sx={{
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  boxShadow: '0 1px 3px rgba(27, 31, 59, 0.06)',
                  '& .MuiChip-label': {
                    padding: '4px 8px',
                  },
                  '&:hover': {
                    backgroundColor: '#F8FAFC',
                  }
                }}
              />
            ))}
          </Box>
        </Box>
        
        <Alert 
          severity="warning" 
          sx={{ 
            marginBottom: '24px',
            backgroundColor: '#FFF3CD',
            borderLeft: '4px solid #FF6B35',
            borderRadius: '12px',
            padding: '16px',
            '& .MuiAlert-icon': {
              color: '#FF6B35',
            }
          }}
        >
          <Typography variant="body2" sx={{ color: '#1B1F3B' }}>
            <strong>Warning:</strong> This action cannot be undone without the emergency password.
          </Typography>
        </Alert>
        
        <Typography variant="h6" sx={{ textAlign: 'center', marginBottom: '16px', color: '#1B1F3B', fontWeight: 600 }}>
          Choose lockout option:
        </Typography>
        
        <Stack spacing={3}>
          {/* Trading Sessions */}
          <Box>
            <Typography variant="subtitle2" sx={{ marginBottom: '12px', color: '#64748B', fontWeight: 500 }}>
              Trading Sessions:
            </Typography>
                        <Grid container spacing={1.5}>
              {Object.entries(TRADING_SESSIONS).map(([key, session]) => {
                const available = isSessionAvailable(key);
                const isSelected = selectedSession === key;
                return (
                  <Grid item xs={3} key={key}>
                    <Button
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => onSessionChange?.(key)}
                      disabled={!available}
                      fullWidth
                      sx={{ 
                        padding: '8px 16px',
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: 500,
                        textTransform: 'none',
                        minHeight: '36px',
                        flexDirection: 'column',
                        gap: '2px',
                        ...(isSelected ? {
                          backgroundColor: '#3B82F6',
                          color: '#FFFFFF',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                          '&:hover': {
                            backgroundColor: '#2563EB',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                          },
                        } : available ? {
                          border: '2px solid #E2E8F0',
                          color: '#1E293B',
                          backgroundColor: 'transparent',
                          '&:hover': {
                            border: '2px solid #3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          },
                        } : {
                          border: '2px solid #E2E8F0',
                          color: '#94A3B8',
                          backgroundColor: '#F8F9FA',
                          '&:disabled': {
                            border: '2px solid #E2E8F0',
                            color: '#94A3B8',
                          }
                        }),
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1 }}>
                        {session.name.replace(' Session', '')}
                      </Box>
                      <Box component="span" sx={{ fontSize: '0.6rem', opacity: 0.7, lineHeight: 1 }}>
                        {available ? formatSessionTime(key) : '(Unavailable)'}
                      </Box>
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Duration Options */}
          <Box>
            <Typography variant="subtitle2" sx={{ marginBottom: '12px', color: '#64748B', fontWeight: 500 }}>
              Or select duration:
            </Typography>
            <Grid container spacing={1.5}>
              {['15 MIN', '30 MIN', '1 HOUR', 'ALL DAY', 'CUSTOM'].map((duration) => (
              <Grid item xs={2.4} key={duration}>
                <Button
                  variant={selectedDuration === duration ? 'contained' : 'outlined'}
                  onClick={() => onDurationChange(duration)}
                  fullWidth
                  sx={{ 
                    padding: '8px 16px', 
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 500,
                    textTransform: 'none',
                    minHeight: '36px',
                    ...(selectedDuration === duration ? {
                      backgroundColor: '#3B82F6',
                      color: '#FFFFFF',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                      '&:hover': {
                        backgroundColor: '#2563EB',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                      },
                    } : {
                      border: '2px solid #E2E8F0',
                      color: '#1E293B',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        border: '2px solid #3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      },
                    }),
                    transition: 'all 0.2s ease',
                  }}
                >
                  {duration}
                </Button>
              </Grid>
                          ))}
            </Grid>
          </Box>
        </Stack>

        {selectedDuration === 'CUSTOM' && (
          <Box sx={{ 
            marginTop: '16px', 
            padding: '16px', 
            border: '2px solid #E2E8F0', 
            borderRadius: '12px',
            backgroundColor: '#F8F9FA'
          }}>
            <Typography variant="subtitle2" sx={{ 
              marginBottom: '4px',
              color: '#64748B',
              fontWeight: 500
            }}>
              Custom Duration:
            </Typography>
            <Box display="flex" gap={2} justifyContent="center">
              <Box>
                <Typography variant="body2" sx={{ 
                  marginBottom: '4px',
                  color: '#64748B',
                  fontWeight: 500
                }}>
                  Hours
                </Typography>
                <TextField
                  type="number"
                  value={customDuration.hours}
                  onChange={(e) => onCustomDurationChange({ ...customDuration, hours: parseInt(e.target.value) || 0 })}
                  size="small"
                  inputProps={{ min: 0, max: 24 }}
                  sx={{ 
                    width: 100,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '14px',
                      height: '40px',
                      '& fieldset': {
                        border: '2px solid #E2E8F0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3B82F6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3B82F6',
                        borderWidth: '2px'
                      },
                    },
                    '& input': {
                      fontWeight: 500,
                      color: '#1E293B',
                      padding: '8px'
                    }
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ 
                  marginBottom: '4px',
                  color: '#64748B',
                  fontWeight: 500
                }}>
                  Minutes
                </Typography>
                <TextField
                  type="number"
                  value={customDuration.minutes}
                  onChange={(e) => onCustomDurationChange({ ...customDuration, minutes: parseInt(e.target.value) || 0 })}
                  size="small"
                  inputProps={{ min: 0, max: 59 }}
                  sx={{ 
                    width: 100,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '14px',
                      height: '40px',
                      '& fieldset': {
                        border: '2px solid #E2E8F0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3B82F6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3B82F6',
                        borderWidth: '2px'
                      },
                    },
                    '& input': {
                      fontWeight: 500,
                      color: '#1E293B',
                      padding: '8px'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        width: '100%'
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            border: '2px solid #E2E8F0',
            color: '#1E293B',
            '&:hover': {
              border: '2px solid #3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          NO, CANCEL
        </Button>

        <Button 
          onClick={onSettingsClick}
          startIcon={<SettingsIcon sx={{ fontSize: '1rem' }} />}
          sx={{ 
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            backgroundColor: '#F8F9FA',
            color: '#64748B',
            '&:hover': { 
              backgroundColor: '#E2E8F0',
              color: '#1E293B',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Settings
        </Button>
        
        <Button 
          onClick={onConfirm}
          variant="contained"
          disabled={!selectedDuration && !selectedSession}
          sx={{ 
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#FF4757',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 2px 8px rgba(255, 71, 87, 0.3)',
            '&:hover': {
              backgroundColor: '#e53e3e',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)',
            },
            '&:disabled': {
              backgroundColor: '#E2E8F0',
              color: '#64748B',
              boxShadow: 'none',
            },
            transition: 'all 0.2s ease',
          }}
        >
          YES, LOCK ME OUT
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default LockoutModal; 