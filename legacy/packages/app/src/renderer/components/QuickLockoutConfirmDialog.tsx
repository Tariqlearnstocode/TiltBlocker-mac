import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

interface QuickLockoutConfirmDialogProps {
  open: boolean;
  durationLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const QuickLockoutConfirmDialog: React.FC<QuickLockoutConfirmDialogProps> = ({
  open,
  durationLabel,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(27, 31, 59, 0.1)',
          border: 'none',
          paddingBottom: '8px',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '8px' }}>
        <Typography variant="h6" fontWeight={600} sx={{ color: '#1B1F3B' }}>
          Confirm Trading <span style={{ color: '#FF4757' }}>Lock-Out?</span>
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#4B5563', mb: 1 }}>
            By clicking yes below, you will be Locked Out from all sites on your blocklist for the selected duration.
          </Typography>
          {durationLabel && (
            <Typography
              variant="subtitle1"
              sx={{ color: '#111827', fontWeight: 600, mt: 0.5, mb: 1 }}
            >
              Duration: {durationLabel}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: '#4B5563', mb: 2 }}>
            Before proceeding, confirm that all orders are closed or you are willing to accept the risk of any open positions.
          </Typography>
        </Box>

        <Alert
          severity="warning"
          sx={{
            backgroundColor: '#FFF3CD',
            borderLeft: '4px solid #FF6B35',
            borderRadius: '12px',
            padding: '12px',
            '& .MuiAlert-icon': {
              color: '#FF6B35',
            },
          }}
        >
          <Typography variant="body2" sx={{ color: '#1B1F3B' }}>
            <strong>Warning:</strong> This action is irreversible without the emergency password.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pt: 1.5,
          pb: 2,
          display: 'flex',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            padding: '8px 16px',
            borderRadius: '10px',
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
          No, Cancel
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            padding: '8px 16px',
            borderRadius: '10px',
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
            transition: 'all 0.2s ease',
          }}
        >
          Yes, Lock Me Out
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickLockoutConfirmDialog;


