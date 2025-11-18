import React from 'react';
import {
  Stack,
  TextField,
  Button,
  Alert,
  Typography
} from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface EmergencyTabProps {
  tempPassword: string;
  onTempPasswordChange: (password: string) => void;
  onSavePassword: () => void;
  onEmergencyUnblock: () => void;
  savedEmergencyPassword: string;
  isActiveBlockingTime: boolean;
  rulesCount: number;
}

const EmergencyTab: React.FC<EmergencyTabProps> = ({
  tempPassword,
  onTempPasswordChange,
  onSavePassword,
  onEmergencyUnblock,
  savedEmergencyPassword,
  isActiveBlockingTime,
  rulesCount
}) => {
  const hasPassword = savedEmergencyPassword && savedEmergencyPassword.length > 0;
  return (
    <Stack spacing={3}>
      {hasPassword ? (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon />}
          sx={{
            backgroundColor: '#D1FAE5',
            borderLeft: '4px solid #00C896',
            borderRadius: '12px',
            padding: '16px',
            '& .MuiAlert-icon': {
              color: '#00C896',
            }
          }}
        >
          <Typography variant="body2" sx={{ color: '#1E293B' }}>
            <strong>Emergency password is set.</strong> You can change it below if needed.
          </Typography>
        </Alert>
      ) : (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
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
            Set up your emergency password here. This password can be used to unlock during active lockout periods.
          </Typography>
        </Alert>
      )}
      
      <TextField
        label={hasPassword ? "New Emergency Password" : "Set Emergency Password"}
        type="password"
        value={tempPassword}
        onChange={(e) => onTempPasswordChange(e.target.value)}
        size="small"
        placeholder={hasPassword ? "Enter new password" : "Enter a memorable password"}
        fullWidth
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
          '& .MuiInputLabel-root': {
            color: '#64748B',
            '&.Mui-focused': {
              color: '#3B82F6',
            },
          },
        }}
      />
      
      <Button
        variant="contained"
        onClick={onSavePassword}
        disabled={!tempPassword}
        sx={{
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          backgroundColor: '#00C896',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0, 200, 150, 0.3)',
          '&:hover': {
            backgroundColor: '#00a176',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 200, 150, 0.4)',
          },
          '&:disabled': {
            backgroundColor: '#E2E8F0',
            color: '#64748B',
            boxShadow: 'none',
          },
          transition: 'all 0.2s ease',
        }}
      >
        {hasPassword ? 'Change Password' : 'Save Emergency Password'}
      </Button>

      <Alert 
        severity="info" 
        sx={{
          backgroundColor: '#F8FAFC',
          borderLeft: '4px solid #3B82F6',
          borderRadius: '12px',
          padding: '16px',
          '& .MuiAlert-icon': {
            color: '#3B82F6',
          }
        }}
      >
        <Typography variant="body2" sx={{ color: '#1E293B' }}>
          <strong>Note:</strong> During an active lockout, you can use the emergency unlock feature on the lockout screen by entering this password.
        </Typography>
      </Alert>
    </Stack>
  );
};

export default EmergencyTab; 