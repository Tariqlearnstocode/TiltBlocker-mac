import React from 'react';
import { Box } from '@mui/material';
import LockoutModal from '../LockoutModal';

interface LockoutTabProps {
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  customDuration: { hours: number; minutes: number };
  onCustomDurationChange: (duration: { hours: number; minutes: number }) => void;
  onLockoutConfirm: () => void;
  blockedSites: string[];
  selectedSession?: string;
  onSessionChange?: (session: string) => void;
  onSettingsClick: () => void;
}

const LockoutTab: React.FC<LockoutTabProps> = (props) => {
  // Render LockoutModal but hide the Dialog backdrop/overlay
  return (
    <Box sx={{ '& .MuiDialog-root': { position: 'static' }, '& .MuiBackdrop-root': { display: 'none' }, '& .MuiDialog-container': { position: 'static', display: 'block' }, '& .MuiPaper-root': { margin: 0, maxWidth: 'none', boxShadow: 'none', borderRadius: 0 } }}>
      <LockoutModal
        open={true}
        onClose={() => {}}
        onSettingsClick={props.onSettingsClick}
        onConfirm={props.onLockoutConfirm}
        selectedDuration={props.selectedDuration}
        onDurationChange={props.onDurationChange}
        customDuration={props.customDuration}
        onCustomDurationChange={props.onCustomDurationChange}
        blockedSites={props.blockedSites}
        selectedSession={props.selectedSession}
        onSessionChange={props.onSessionChange}
      />
    </Box>
  );
};

export default LockoutTab; 