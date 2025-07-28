import React from 'react';
import {
  Stack,
  Button,
  Typography,
  Alert,
  Grid,
  Box,
  TextField
} from '@mui/material';

interface LockoutTabProps {
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  customDuration: { hours: number; minutes: number };
  onCustomDurationChange: (duration: { hours: number; minutes: number }) => void;
  onLockoutConfirm: () => void;
}

const LockoutTab: React.FC<LockoutTabProps> = ({
  selectedDuration,
  onDurationChange,
  customDuration,
  onCustomDurationChange,
  onLockoutConfirm
}) => {
  return (
    <Stack spacing={4} sx={{ textAlign: 'left' }}>
      <Typography variant="body1" sx={{ textAlign: 'left', color: '#8B8B8B', lineHeight: 1.5 }}>
        Block all sites in your blocklist for the selected duration.
      </Typography>
      
      <Alert 
        severity="warning"
        sx={{
          backgroundColor: '#FFF3CD',
          borderLeft: '4px solid #FF6B35',
          borderRadius: '12px',
          padding: '16px',
          '& .MuiAlert-icon': {
            color: '#FF6B35',
          }
        }}
      >
        <Typography variant="body2" sx={{ color: '#1E293B' }}>
          <strong>Warning:</strong> This action cannot be undone without the emergency password.
        </Typography>
      </Alert>
      
      <Typography variant="subtitle1" sx={{ textAlign: 'left', fontWeight: 600, color: '#1E293B' }}>
        Select lockout duration:
      </Typography>
      
      <Stack spacing={2}>
        <Box>
          <Grid container spacing={1.5} sx={{ marginLeft: '-12px' }}>
            {['15 MIN', '30 MIN', '1 HOUR', 'ALL DAY', 'CUSTOM'].map((duration) => (
              <Grid item key={duration}>
                <Button
                  variant={selectedDuration === duration ? 'contained' : 'outlined'}
                  onClick={() => onDurationChange(duration)}
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

        {selectedDuration === 'CUSTOM' && (
          <>
            <Typography variant="subtitle2" sx={{ 
              marginTop: '16px',
              marginBottom: '12px', 
              color: '#64748B', 
              fontWeight: 500, 
              textAlign: 'left' 
            }}>
              Set custom duration:
            </Typography>
            <Box display="flex" gap={2} justifyContent="flex-start">
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
                  onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0;
                    onCustomDurationChange({ ...customDuration, hours });
                    onDurationChange('CUSTOM');
                  }}
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
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    onCustomDurationChange({ ...customDuration, minutes });
                    onDurationChange('CUSTOM');
                  }}
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
          </>
        )}
      </Stack>


      
      <Box sx={{ paddingTop: '16px' }}>
        <Button 
          onClick={onLockoutConfirm}
          variant="contained"
          disabled={!selectedDuration}
          fullWidth
          size="medium"
          sx={{ 
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderRadius: '8px',
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
          START LOCKOUT
        </Button>
      </Box>
    </Stack>
  );
};

export default LockoutTab; 