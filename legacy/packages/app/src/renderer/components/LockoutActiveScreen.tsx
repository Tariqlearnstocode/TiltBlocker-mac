import React, { useState, useEffect } from 'react';
import {
  Stack,
  Typography,
  Button,
  Alert,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Fade
} from '@mui/material';
import { Warning as WarningIcon, Lock as LockIcon, Schedule as ScheduleIcon, Block as BlockIcon, Security as SecurityIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';

interface LockoutActiveScreenProps {
  lockoutEndTime: Date | null;
  onExtend: (additionalMinutes: number) => void;
  onEmergencyUnlock: () => void;
  blockedSites?: string[];
}

const LockoutActiveScreen: React.FC<LockoutActiveScreenProps> = ({
  lockoutEndTime,
  onExtend,
  onEmergencyUnlock,
  blockedSites = []
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyPassword, setEmergencyPassword] = useState('');
  const [showAllSites, setShowAllSites] = useState(false);
  const [currentSayingIndex, setCurrentSayingIndex] = useState(0);

  const motivationalSayings = [
    "🏆 You're building the discipline of a professional trader",
    "💪 Every moment locked out is an investment in your future success",
    "🧠 Smart traders know when to step away from the markets",
    "⚡ Your emotional control is your greatest trading advantage",
    "🎯 Discipline today = Consistent profits tomorrow",
    "🛡️ You're protecting your capital like a true professional",
    "🔥 Elite traders master themselves before mastering the markets",
    "💎 This lockout is forging you into a diamond-handed trader",
    "🚀 Your future self will thank you for this disciplined decision",
    "🎖️ Professional traders take breaks to stay sharp",
    "⭐ You're choosing long-term success over short-term impulses",
    "🧘 Mental clarity beats emotional trading every time",
    "🏅 This is what separating yourself from 90% of traders looks like",
    "💯 Your commitment to discipline is your edge in the market",
    "🎪 While others chase FOMO, you're building lasting wealth"
  ];

  useEffect(() => {
    if (!lockoutEndTime) return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = lockoutEndTime.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining('00:00:00');
        setProgress(100);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );

      // Calculate progress based on a typical 8-hour trading day
      const totalMs = 8 * 60 * 60 * 1000; // 8 hours in ms
      const elapsedMs = totalMs - remaining;
      setProgress(Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSayingIndex((prev) => (prev + 1) % motivationalSayings.length);
    }, 4000); // Change saying every 4 seconds

    return () => clearInterval(interval);
  }, [motivationalSayings.length]);

  const handleEmergencySubmit = () => {
    onEmergencyUnlock();
    setShowEmergencyDialog(false);
    setEmergencyPassword('');
  };

  const extendOptions = [
    { label: '15 MIN', minutes: 15 },
    { label: '30 MIN', minutes: 30 },
    { label: '1 HOUR', minutes: 60 },
    { label: '2 HOURS', minutes: 120 }
  ];

  const displayedSites = showAllSites ? blockedSites : blockedSites.slice(0, 6);
  const hiddenCount = blockedSites.length - 6;

  return (
    <>
      <Stack spacing={3} sx={{ padding: '24px', maxWidth: '560px', margin: '0 auto' }}>
        {/* Hero Card with Gradient Timer */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          borderRadius: '20px',
          color: 'white',
          textAlign: 'center',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
        }}>
          <CardContent sx={{ padding: '32px 24px' }}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <SecurityIcon sx={{ 
                fontSize: 48, 
                marginBottom: '16px', 
                opacity: 0.9,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
              
              <Typography variant="h1" sx={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Trading Lockout Active
              </Typography>
              
              <Typography variant="h6" sx={{ 
                opacity: 1, 
                fontWeight: 500,
                marginBottom: '24px',
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                Stay disciplined. Markets will be here when you return.
              </Typography>

              {/* Enhanced Timer Display */}
              <Box sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <Typography variant="h2" sx={{ 
                  fontSize: '3rem', 
                  fontWeight: 700, 
                  marginBottom: '8px',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  color: '#FFFFFF'
                }}>
                  {timeRemaining}
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  marginBottom: '16px',
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: 500
                }}>
                  {lockoutEndTime?.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })} Local - {lockoutEndTime?.toLocaleDateString()}
                </Typography>
                
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 400
                }}>
                  ({lockoutEndTime?.toLocaleTimeString('en-US', { 
                    timeZone: 'America/Chicago',
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })} CT - Exchange Time)
                </Typography>

                {/* Progress Bar */}
                <Box sx={{ marginTop: '16px' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Decorative Background Elements */}
            <Box sx={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              zIndex: 1
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              zIndex: 1
            }} />
          </CardContent>
        </Card>

        {/* Motivational Banner */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #00C896 0%, #00A67A 100%)',
          borderRadius: '16px',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0, 200, 150, 0.3)',
          minHeight: '100px'
        }}>
          <CardContent sx={{ padding: '20px', textAlign: 'center' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px', 
              marginBottom: '12px' 
            }}>
              <TrophyIcon sx={{ color: '#FFD700', fontSize: 24 }} />
              <Typography variant="h2" sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#FFFFFF'
              }}>
                Discipline Victory
              </Typography>
              <TrophyIcon sx={{ color: '#FFD700', fontSize: 24 }} />
            </Box>
            
            <Box sx={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fade in={true} timeout={1000} key={currentSayingIndex}>
                <Typography variant="body1" sx={{ 
                  color: '#FFFFFF',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  fontSize: '1.05rem',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {motivationalSayings[currentSayingIndex]}
                </Typography>
              </Fade>
            </Box>

            {/* Progress dots indicator */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '6px', 
              marginTop: '12px' 
            }}>
              {motivationalSayings.slice(0, 5).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: index === (currentSayingIndex % 5) 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Box>

            {/* Decorative elements */}
            <Box sx={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              zIndex: 1
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: '-20px',
              left: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              zIndex: 1
            }} />
          </CardContent>
        </Card>

        {/* Blocked Sites Card */}
        {blockedSites.length > 0 && (
          <Card sx={{ 
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <CardContent sx={{ padding: '20px' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px' 
              }}>
                <BlockIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                <Typography variant="h2" sx={{ 
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1E293B'
                }}>
                  Blocked Sites ({blockedSites.length})
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
                marginBottom: hiddenCount > 0 ? '12px' : 0
              }}>
                {displayedSites.map((site, index) => (
                  <Chip
                    key={index}
                    label={site}
                    size="medium"
                    sx={{
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #F87171',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#FEE2E2'
                      }
                    }}
                  />
                ))}
                
                {!showAllSites && hiddenCount > 0 && (
                  <Chip
                    label={`+${hiddenCount} more`}
                    size="medium"
                    clickable
                    onClick={() => setShowAllSites(true)}
                    sx={{
                      backgroundColor: '#E2E8F0',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#CBD5E1',
                        color: '#334155'
                      }
                    }}
                  />
                )}
              </Box>

              {showAllSites && hiddenCount > 0 && (
                <Button
                  size="small"
                  onClick={() => setShowAllSites(false)}
                  sx={{
                    color: '#475569',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    minWidth: 'auto',
                    '&:hover': {
                      color: '#334155',
                      backgroundColor: 'rgba(71, 85, 105, 0.1)'
                    }
                  }}
                >
                  Show less
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Extension Controls Card */}
        <Card sx={{ 
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <CardContent sx={{ padding: '20px' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px' 
            }}>
              <ScheduleIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
              <Typography variant="h2" sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1E293B'
              }}>
                Need more focus time?
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ 
              color: '#475569', 
              marginBottom: '16px',
              lineHeight: 1.5,
              fontWeight: 500
            }}>
              Extend your lockout to maintain discipline during volatile market conditions.
            </Typography>
            
            <Grid container spacing={2}>
              {extendOptions.map((option) => (
                <Grid item xs={6} sm={3} key={option.label}>
                  <Button
                    variant="outlined"
                    onClick={() => onExtend(option.minutes)}
                    fullWidth
                    sx={{ 
                      padding: '14px 12px', 
                      fontSize: '0.875rem',
                      borderRadius: '12px',
                      fontWeight: 500,
                      textTransform: 'none',
                      border: '2px solid #E2E8F0',
                      color: '#1E293B',
                      minHeight: '56px',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        border: '2px solid #3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        color: '#3B82F6',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    +{option.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Emergency Access Card */}
        <Card sx={{ 
          borderRadius: '16px',
          border: '1px solid #FED7AA',
          backgroundColor: '#FFF7ED',
          boxShadow: '0 2px 8px rgba(255, 107, 53, 0.1)'
        }}>
          <CardContent sx={{ padding: '20px', textAlign: 'center' }}>
            <Typography variant="h3" sx={{ 
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#1E293B',
              marginBottom: '8px'
            }}>
              Emergency Market Access
            </Typography>
            
            <Typography variant="body2" sx={{ 
              color: '#475569', 
              marginBottom: '16px',
              lineHeight: 1.4,
              fontWeight: 500,
              fontSize: '0.95rem'
            }}>
              Only use for genuine trading emergencies or critical market events
            </Typography>
            
            <Button
              variant="outlined"
              onClick={() => setShowEmergencyDialog(true)}
              sx={{ 
                padding: '12px 32px', 
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 500,
                textTransform: 'none',
                border: '2px solid #FF6B35',
                color: '#FF6B35',
                minWidth: '160px',
                '&:hover': {
                  border: '2px solid #EA580C',
                  backgroundColor: 'rgba(255, 107, 53, 0.05)',
                  color: '#EA580C',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Emergency Unlock
            </Button>
          </CardContent>
        </Card>
      </Stack>

      {/* Enhanced Emergency Dialog */}
      <Dialog 
        open={showEmergencyDialog} 
        onClose={() => setShowEmergencyDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: '#FFFFFF',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: 'none',
          }
        }}
      >
        <DialogTitle sx={{ paddingTop: '24px', paddingX: '24px', paddingBottom: '8px' }}>
          <Typography variant="h1" sx={{ 
            fontSize: '1.5rem',
            fontWeight: 600, 
            color: '#1E293B',
            textAlign: 'center' 
          }}>
            Emergency Market Access
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ paddingX: '24px', paddingY: '16px' }}>
          <Alert 
            severity="warning" 
            sx={{ 
              marginBottom: '16px',
              backgroundColor: '#FFF7ED',
              borderLeft: '4px solid #FF6B35',
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: '#FF6B35'
              }
            }}
          >
            <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 500 }}>
              This will immediately end your lockout. Use only for genuine emergencies.
            </Typography>
          </Alert>
          
          <TextField
            autoFocus
            label="Emergency Password"
            type="password"
            fullWidth
            value={emergencyPassword}
            onChange={(e) => setEmergencyPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEmergencySubmit()}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '16px',
                '& fieldset': {
                  border: '2px solid #E2E8F0',
                },
                '&:hover fieldset': {
                  borderColor: '#FF6B35',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FF6B35',
                  boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#475569',
                '&.Mui-focused': {
                  color: '#FF6B35',
                },
              },
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ paddingX: '24px', paddingBottom: '24px', gap: '12px' }}>
          <Button 
            onClick={() => setShowEmergencyDialog(false)}
            variant="outlined"
            sx={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              border: '2px solid #E2E8F0',
              color: '#1E293B',
              '&:hover': {
                border: '2px solid #64748B',
                backgroundColor: 'rgba(100, 116, 139, 0.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleEmergencySubmit} 
            variant="contained"
            disabled={!emergencyPassword.trim()}
            sx={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              backgroundColor: '#FF6B35',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
              '&:hover': {
                backgroundColor: '#EA580C',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(255, 107, 53, 0.4)',
              },
              '&:disabled': {
                backgroundColor: '#E2E8F0',
                color: '#64748B',
                boxShadow: 'none',
                transform: 'none'
              },
              transition: 'all 0.2s ease',
            }}
          >
            Unlock Now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LockoutActiveScreen; 