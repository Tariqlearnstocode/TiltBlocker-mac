import React from 'react';
import {
  Stack,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Alert
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';

interface ScheduleSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[];
}

interface ScheduleTabProps {
  scheduleSettings: ScheduleSettings;
  onScheduleChange: (settings: ScheduleSettings) => void;
  isActiveBlockingTime: boolean;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  scheduleSettings,
  onScheduleChange,
  isActiveBlockingTime
}) => {
  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={
          <Switch
            checked={scheduleSettings.enabled}
            onChange={(e) => onScheduleChange({...scheduleSettings, enabled: e.target.checked})}
          />
        }
        label="Enable Time-Based Blocking"
      />
      
      {scheduleSettings.enabled && (
        <>
          <Box display="flex" gap={2}>
            <TextField
              label="Start Time"
              type="time"
              value={scheduleSettings.startTime}
              onChange={(e) => onScheduleChange({...scheduleSettings, startTime: e.target.value})}
              size="small"
            />
            <TextField
              label="End Time"
              type="time"
              value={scheduleSettings.endTime}
              onChange={(e) => onScheduleChange({...scheduleSettings, endTime: e.target.value})}
              size="small"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Days: {scheduleSettings.days.join(', ')}
          </Typography>
          
          {isActiveBlockingTime && (
            <Alert severity="info" icon={<ScheduleIcon />}>
              Blocking is currently active based on your schedule
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
};

export default ScheduleTab; 