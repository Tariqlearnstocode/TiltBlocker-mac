import React, { useState } from 'react';
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
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
// CME Futures trading hours in Central Time (accounts for DST via America/Chicago timezone)
// Electronic trading: Sunday 5 PM - Friday 4 PM CT (with daily 4-5 PM break)
export const TRADING_SESSIONS = {
  'TOKYO': { 
    name: 'Tokyo',
    startHour: 17, // 5 PM
    startMinute: 0,
    endHour: 16, // 4 PM next day
    endMinute: 0
  },
  'LONDON': { 
    name: 'London',
    startHour: 2,
    startMinute: 0,
    endHour: 16,
    endMinute: 0
  },
  'NEW_YORK': { 
    name: 'New York', 
    startHour: 8,
    startMinute: 30,
    endHour: 16,
    endMinute: 0
  }
};

const isSessionAvailable = (sessionKey: string): boolean => {
  const now = new Date();
  const day = now.getDay();
  
  // CME futures trade nearly 24/5: Sunday evening through Friday afternoon
  // Tokyo session available Sun-Fri (starts Sunday evening)
  if (sessionKey === 'TOKYO') {
    return day >= 0 && day <= 5; // Sunday through Friday
  }
  // London and New York sessions available Mon-Fri
  return day >= 1 && day <= 5;
};

const formatSessionTime = (sessionKey: string, showLocalTime: boolean = false): string => {
  const session = TRADING_SESSIONS[sessionKey as keyof typeof TRADING_SESSIONS];
  if (!session) return '';
  
  if (!showLocalTime) {
    // Show in Central Time
    const formatTime = (hour: number, minute: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinute = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : '';
      return `${displayHour}${displayMinute}${period}`;
    };
    
    return `(${formatTime(session.startHour, session.startMinute)}-${formatTime(session.endHour, session.endMinute)} CT)`;
  } else {
    // Convert to user's local time
    const now = new Date();
    const realNow = new Date();
    const nowCT = new Date(realNow.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    
    // Calculate offset between local and CT
    const offsetMs = realNow.getTime() - nowCT.getTime();
    
    // Create dates in CT and convert to local
    const startInCT = new Date(nowCT);
    startInCT.setHours(session.startHour, session.startMinute, 0, 0);
    const startInLocal = new Date(startInCT.getTime() + offsetMs);
    
    const endInCT = new Date(nowCT);
    endInCT.setHours(session.endHour, session.endMinute, 0, 0);
    const endInLocal = new Date(endInCT.getTime() + offsetMs);
    
    const formatLocalTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: session.startMinute > 0 || session.endMinute > 0 ? '2-digit' : undefined,
        hour12: true
      });
    };
    
    // Get timezone abbreviation
    const tzAbbr = now.toLocaleString('en-US', {
      timeZoneName: 'short'
    }).split(' ').pop();
    
    return `(${formatLocalTime(startInLocal)}-${formatLocalTime(endInLocal)} ${tzAbbr})`;
  }
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
  // State for timezone display preference
  const [showLocalTime, setShowLocalTime] = useState(false);
  
  // Calculate lockout end time
  const calculateEndTime = (): Date | null => {
    const now = new Date();
    
    // If session is selected
    if (selectedSession) {
      const session = TRADING_SESSIONS[selectedSession as keyof typeof TRADING_SESSIONS];
      if (session) {
        // Get current time in Central Time
        const nowCT = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
        const currentHour = nowCT.getHours();
        const currentMinute = nowCT.getMinutes();
        
        // Create end time in Central Time
        let endYear = nowCT.getFullYear();
        let endMonth = nowCT.getMonth();
        let endDay = nowCT.getDate();
        
        // Determine if we need to add a day
        let addDay = false;
        
        // Overnight sessions (Tokyo: 5 PM - 4 PM next day)
        if (session.endHour < session.startHour) {
          // Tokyo session is nearly 24 hours: 5 PM today -> 4 PM tomorrow
          // The session spans midnight
          
          if (currentHour >= session.startHour) {
            // Currently after 5 PM - we're in today's session that ends tomorrow at 4 PM
            addDay = true;
          } else if (currentHour < session.endHour || 
                    (currentHour === session.endHour && currentMinute < session.endMinute)) {
            // Currently before 4 PM - we're in yesterday's session that ends today at 4 PM
            addDay = false;
          } else {
            // Between 4 PM and 5 PM - waiting for next session to start
            // Next session ends tomorrow at 4 PM
            addDay = true;
          }
        } else {
          // Regular daytime sessions (London, New York)
          // Check if we're past the end time
          if (currentHour > session.endHour || 
              (currentHour === session.endHour && currentMinute >= session.endMinute)) {
            addDay = true;
          }
        }
        
        if (addDay) {
          const tomorrow = new Date(nowCT);
          tomorrow.setDate(tomorrow.getDate() + 1);
          endYear = tomorrow.getFullYear();
          endMonth = tomorrow.getMonth();
          endDay = tomorrow.getDate();
        }
        
        // Calculate duration from now to session end in CT, then add to actual now
        // This automatically handles timezone conversion!
        const realNow = new Date();
        const nowCTForCalc = new Date(realNow.toLocaleString("en-US", {timeZone: "America/Chicago"}));
        
        // Create the end time in CT
        const endTimeCTForCalc = new Date(endYear, endMonth, endDay, session.endHour, session.endMinute, 0);
        
        // Calculate the duration in milliseconds
        const durationMs = endTimeCTForCalc.getTime() - nowCTForCalc.getTime();
        
        // Add this duration to the real current time - this gives us the end time in user's timezone!
        const endTimeInUserTZ = new Date(realNow.getTime() + durationMs);
        
        return endTimeInUserTZ;
      }
    }
    
    // If duration is selected
    if (selectedDuration) {
      if (selectedDuration === 'ALL DAY') {
        // "All Day" means until midnight CST
        const realNow = new Date();
        const nowCT = new Date(realNow.toLocaleString("en-US", {timeZone: "America/Chicago"}));
        
        // Set to midnight tonight in CT
        const midnightCT = new Date(nowCT);
        midnightCT.setHours(24, 0, 0, 0); // This automatically becomes tomorrow at 00:00
        
        // Calculate duration from now to midnight in CT
        const durationMs = midnightCT.getTime() - nowCT.getTime();
        
        // Add this duration to the real current time
        const midnightInUserTZ = new Date(realNow.getTime() + durationMs);
        
        return midnightInUserTZ;
      } else {
        // Other durations are relative to current time
        let milliseconds = 0;
        
        switch (selectedDuration) {
          case '15 MIN':
            milliseconds = 15 * 60 * 1000;
            break;
          case '30 MIN':
            milliseconds = 30 * 60 * 1000;
            break;
          case '1 HOUR':
            milliseconds = 60 * 60 * 1000;
            break;
          case '30 DAYS':
            milliseconds = 30 * 24 * 60 * 60 * 1000;
            break;
          case 'CUSTOM':
            milliseconds = (customDuration.hours * 60 + customDuration.minutes) * 60 * 1000;
            break;
        }
        
        if (milliseconds > 0) {
          return new Date(now.getTime() + milliseconds);
        }
      }
    }
    
    return null;
  };
  
  const endTime = calculateEndTime();
  const formatEndTime = (time: Date): string => {
    const baseOptions = {
      weekday: 'short' as const,
      month: 'short' as const,
      day: 'numeric' as const,
      hour: 'numeric' as const,
      minute: '2-digit' as const,
      hour12: true as const,
    };

    // When showLocalTime = false, show in Exchange time (America/Chicago)
    const timeString = time.toLocaleString('en-US', {
      ...baseOptions,
      ...(showLocalTime ? {} : { timeZone: 'America/Chicago' }),
    });
    
    const timezone = time.toLocaleString('en-US', {
      timeZoneName: 'short',
      ...(showLocalTime ? {} : { timeZone: 'America/Chicago' }),
    }).split(' ').pop();
    
    return `${timeString} ${timezone}`;
  };
  
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
            {blockedSites.slice(0, 5).map((site, index) => (
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
            {blockedSites.length > 5 && (
              <Chip
                label={`+${blockedSites.length - 5} more`}
                sx={{
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  '& .MuiChip-label': {
                    padding: '4px 8px',
                  },
                }}
                onClick={onSettingsClick}
              />
            )}
          </Box>
          </Box>
        
        {endTime && (
          <Box sx={{ 
            textAlign: 'center',
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: '#F0F9FF',
            borderRadius: '12px',
            border: '2px solid #3B82F6',
          }}>
            <Typography variant="body2" sx={{ 
              color: '#64748B',
              fontSize: '0.75rem',
              fontWeight: 500,
              marginBottom: '4px'
            }}>
              You will be locked out until
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#1E293B',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              {formatEndTime(endTime)}
            </Typography>
          </Box>
        )}
        
        <Typography variant="h6" sx={{ textAlign: 'center', marginBottom: '16px', color: '#1B1F3B', fontWeight: 600 }}>
          Choose lockout option:
        </Typography>
        
        <Stack spacing={3}>
          {/* Trading Sessions */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 500 }}>
                Trading Sessions:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ 
                  color: !showLocalTime ? '#3B82F6' : '#64748B',
                  fontSize: '0.7rem',
                  fontWeight: !showLocalTime ? 600 : 400,
                  transition: 'all 0.2s'
                }}>
                  Exchange
                </Typography>
                <Switch
                  size="small"
                  checked={showLocalTime}
                  onChange={(e) => setShowLocalTime(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3B82F6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#3B82F6',
                    },
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: showLocalTime ? '#3B82F6' : '#64748B',
                  fontSize: '0.7rem',
                  fontWeight: showLocalTime ? 600 : 400,
                  transition: 'all 0.2s'
                }}>
                  Local
                </Typography>
              </Box>
            </Box>
                        <Grid container spacing={1.5}>
              {Object.entries(TRADING_SESSIONS).map(([key, session]) => {
                const available = isSessionAvailable(key);
                const isSelected = selectedSession === key;
                return (
                  <Grid item xs={4} key={key}>
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
                        {available ? formatSessionTime(key, showLocalTime) : '(Unavailable)'}
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
              {['15 MIN', '1 HOUR', 'ALL DAY', '30 DAYS', 'CUSTOM'].map((duration) => (
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
      
      <Alert 
        severity="warning" 
        sx={{ 
          margin: '0 24px 24px',
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
    </Dialog>
  );
};
export default LockoutModal; 