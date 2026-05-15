import React from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

interface QuickLockoutPreset {
  id: number;
  label: string;
  minutes: number;
  enabled: boolean;
}

interface LockoutFabProps {
  onClick: () => void;
  quickLockouts: QuickLockoutPreset[];
  onQuickLockoutClick: (preset: QuickLockoutPreset) => void;
}

const LockoutFab: React.FC<LockoutFabProps> = ({ onClick, quickLockouts, onQuickLockoutClick }) => {
  const activePresets = quickLockouts
    .filter(p => p.enabled && p.minutes > 0)
    .slice(0, 3);

  const formatButtonText = (preset: QuickLockoutPreset) => {
    // If it looks like a session, use 2-3 letter code
    if (preset.label.startsWith('Tokyo')) return 'Tok';
    if (preset.label.startsWith('London')) return 'Lon';
    if (preset.label.startsWith('New York')) return 'NY';
    
    const minutes = preset.minutes;
    if (minutes % 60 === 0 && minutes >= 60) {
      const hours = minutes / 60;
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'flex-end',
      }}
    >
      <Fab
        color="primary"
        onClick={onClick}
        sx={{
          background: '#4A90FF',
          color: '#FFFFFF',
          width: 56,
          height: 56,
          boxShadow: '0 4px 20px rgba(74, 144, 255, 0.3)',
          '&:hover': {
            background: '#3170db',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 24px rgba(74, 144, 255, 0.4)',
          },
          transition: 'all 0.2s ease-out',
        }}
        className="animate-float"
      >
        <BlockIcon />
      </Fab>

      {activePresets.map((preset) => (
        <Tooltip key={preset.id} title={`Quick lockout: ${preset.label}`} placement="left">
          <Fab
            size="small"
            color="secondary"
            onClick={() => onQuickLockoutClick(preset)}
            sx={{
              background: '#F97316',
              color: '#FFFFFF',
              width: 40,
              height: 40,
              minHeight: 40,
              boxShadow: '0 3px 14px rgba(249, 115, 22, 0.4)',
              fontSize: '0.75rem',
              fontWeight: 600,
              '&:hover': {
                background: '#EA580C',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 18px rgba(249, 115, 22, 0.6)',
              },
              transition: 'all 0.2s ease-out',
            }}
          >
            {formatButtonText(preset)}
          </Fab>
        </Tooltip>
      ))}
    </Box>
  );
};

export default LockoutFab;

