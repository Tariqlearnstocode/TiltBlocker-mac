import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

interface PreferencesTabProps {
  showFab: boolean;
  onShowFabChange: (show: boolean) => void;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({
  showFab,
  onShowFabChange,
}) => {
  return (
    <Box>
      {/* UI Preferences Section */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <VisibilityIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            User Interface
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Box p={2.5}>
            {/* TODO: Re-enable when alternative settings access is implemented (system tray menu, menu bar, etc.) */}
            <FormControlLabel
              control={
                <Switch
                  checked={true}
                  disabled={true}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#94a3b8',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#94a3b8',
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#94a3b8' }}>
                    Show Quick Lockout Button
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Currently disabled - FAB is the only way to access settings
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Info Box */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: '12px',
          p: 2.5,
        }}
      >
        <Box display="flex" gap={2}>
          <SpeedIcon sx={{ color: '#92400E', fontSize: 20, mt: 0.3 }} />
          <Box>
            <Typography variant="body2" sx={{ color: '#92400E', mb: 0.5 }}>
              <strong>Coming Soon:</strong> This setting is temporarily disabled because the FAB is currently
              the only way to access settings.
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400E' }}>
              We'll enable this option once we add alternative access methods like system tray menu or menu bar.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PreferencesTab;

