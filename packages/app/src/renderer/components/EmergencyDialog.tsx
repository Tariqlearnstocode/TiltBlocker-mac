import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface EmergencyDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  password: string;
  onPasswordChange: (password: string) => void;
}

const EmergencyDialog: React.FC<EmergencyDialogProps> = ({
  open,
  onClose,
  onConfirm,
  password,
  onPasswordChange
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
          boxShadow: '0 4px 20px rgba(30, 41, 59, 0.10)',
          border: 'none',
        }
      }}
    >
      <DialogTitle sx={{ paddingTop: '24px', paddingX: '24px', paddingBottom: '8px' }}>
        <Typography variant="h5" fontWeight="600" sx={{ color: '#1E293B', fontSize: '1.5rem', textAlign: 'center' }}>
          Emergency Unblock
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ paddingX: '24px', paddingY: '16px' }}>
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ 
            marginBottom: '16px',
            backgroundColor: '#FFF3CD',
            borderLeft: '4px solid #FF6B35',
            borderRadius: '12px',
            padding: '16px',
            '& .MuiAlert-icon': {
              color: '#FF6B35',
            }
          }}
        >
          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
            Emergency access should be used responsibly during genuine trading emergencies only.
          </Typography>
        </Alert>
        
        <Typography variant="body2" sx={{ marginBottom: '16px', color: '#64748B', textAlign: 'center' }}>
          Enter your emergency password to temporarily disable all blocking rules.
        </Typography>
        
        <TextField
          autoFocus
          label="Emergency Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Enter your emergency password"
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
      </DialogContent>
      
      <DialogActions sx={{ paddingX: '24px', paddingBottom: '24px', gap: '12px' }}>
        <Button 
          onClick={onClose}
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
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '&:hover': {
              border: '2px solid #64748B',
              backgroundColor: 'rgba(100, 116, 139, 0.05)',
            },
          }}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={onConfirm} 
          variant="contained"
          disabled={!password.trim()}
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
            boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#e55029',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.4)',
            },
            '&:disabled': {
              backgroundColor: '#E2E8F0',
              color: '#64748B',
              boxShadow: 'none',
            },
          }}
        >
          Unblock All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmergencyDialog; 