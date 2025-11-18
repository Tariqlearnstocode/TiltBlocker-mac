import React from 'react';
import { Box, Typography, TextField, Stack, Checkbox } from '@mui/material';
import { TRADING_SESSIONS } from '../LockoutModal';

export interface QuickLockoutPreset {
  id: number;
  label: string;
  minutes: number;
  enabled: boolean;
}

const getSessionMinutes = (key: keyof typeof TRADING_SESSIONS) => {
  const session = TRADING_SESSIONS[key];
  const start = session.startHour * 60 + session.startMinute;
  const end = session.endHour * 60 + session.endMinute;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const formatTime = (hour: number, minute: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : '';
  return `${displayHour}${displayMinute}${period}`;
};

const getSessionLabel = (key: keyof typeof TRADING_SESSIONS) => {
  const session = TRADING_SESSIONS[key];
  if (!session) return key;
  return `${session.name} (${formatTime(session.startHour, session.startMinute)}-${formatTime(session.endHour, session.endMinute)} CT)`;
};

// Use a default of 0 for custom, and let the logic handle rendering 0 as 0
export const QUICK_LOCKOUT_OPTION_DEFS = [
  { key: '15_MIN', label: '15 Min', defaultMinutes: 15 },
  { key: '1_HOUR', label: '1 Hour', defaultMinutes: 60 },
  { key: 'ALL_DAY', label: 'All Day', defaultMinutes: 24 * 60 },
  { key: '30_DAYS', label: '30 Days', defaultMinutes: 30 * 24 * 60 },
  { key: 'TOKYO', label: getSessionLabel('TOKYO'), defaultMinutes: getSessionMinutes('TOKYO') },
  { key: 'LONDON', label: getSessionLabel('LONDON'), defaultMinutes: getSessionMinutes('LONDON') },
  { key: 'NEW_YORK', label: getSessionLabel('NEW_YORK'), defaultMinutes: getSessionMinutes('NEW_YORK') },
  { key: 'CUSTOM', label: 'Custom Time', defaultMinutes: 0 },
] as const;

const OPTION_DEFS = QUICK_LOCKOUT_OPTION_DEFS;

interface QuickLockoutTabProps {
  presets: QuickLockoutPreset[];
  onChange: (presets: QuickLockoutPreset[]) => void;
}

const QuickLockoutTab: React.FC<QuickLockoutTabProps> = ({ presets, onChange }) => {
  // Normalize incoming presets to our fixed list of options
  const resolvedPresets: QuickLockoutPreset[] = OPTION_DEFS.map((def, index) => {
    const existing = presets[index];
    
    // Check if the existing preset matches the current definition
    // If labels don't match OR minutes don't match (for non-custom), structure changed - use defaults
    const isStructureChanged = existing && (
      existing.label !== def.label || 
      (def.key !== 'CUSTOM' && existing.minutes !== def.defaultMinutes)
    );
    
    return {
      id: existing?.id ?? index + 1,
      label: def.label, // Always use the current definition label
      // For CUSTOM, preserve user's minutes. For everything else, always use defaultMinutes
      minutes: def.key === 'CUSTOM' && existing && !isStructureChanged
        ? existing.minutes 
        : def.defaultMinutes,
      enabled: isStructureChanged ? false : (existing?.enabled ?? false),
    };
  });

  const updatePresets = (index: number, changes: Partial<QuickLockoutPreset>) => {
    const updated = resolvedPresets.map((p, i) => (i === index ? { ...p, ...changes } : p));
    onChange(updated);
  };

  const handleToggleEnabled = (index: number, enabled: boolean) => {
    updatePresets(index, { enabled });
  };

  const handleCustomChange = (hours: number, minutes: number) => {
    const clampedHours = Math.max(0, hours);
    const clampedMinutes = Math.max(0, Math.min(59, minutes));
    const total = clampedHours * 60 + clampedMinutes;
    const customIndex = OPTION_DEFS.length - 1;
    // Automatically enable when typing in custom time
    updatePresets(customIndex, { minutes: total, enabled: true });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
        Choose which quick lockout options appear as one-click buttons. Up to three enabled options
        will show next to the main lockout button.
      </Typography>

      <Box
        sx={{
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {resolvedPresets.map((preset, index) => {
          const def = OPTION_DEFS[index];
          const isCustom = def.key === 'CUSTOM';

          // Use preset minutes directly.
          // For non-custom, if 0, fallback to default (though resolvedPresets handles init).
          // For custom, allow 0.
          const totalMinutes = preset.minutes; 
          
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          return (
            <Box
              key={preset.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                backgroundColor: '#FFFFFF',
                '&:not(:last-of-type)': {
                  borderBottom: '1px solid #F1F5F9',
                },
                '&:hover': {
                  backgroundColor: '#F8FAFC',
                },
                transition: 'background-color 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#334155', fontWeight: 500, fontSize: '0.85rem' }}
                >
                  {def.key.includes('_MIN') || def.key.includes('_HOUR') || def.key === 'ALL_DAY' || def.key === '30_DAYS' || def.key === 'CUSTOM' 
                    ? def.label 
                    : def.label.split(' (')[0]
                  }
                </Typography>
                {(def.key === 'TOKYO' || def.key === 'LONDON' || def.key === 'NEW_YORK') && (
                  <Typography
                    variant="caption"
                    sx={{ color: '#64748B', fontSize: '0.7rem', lineHeight: 1.1, mt: 0.25 }}
                  >
                    {def.label.match(/\((.*?)\)/)?.[1] || ''}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isCustom && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, marginRight: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={hours === 0 && !preset.enabled ? '' : hours} 
                        placeholder="0"
                        onChange={e => {
                          const valStr = e.target.value;
                          const val = valStr === '' ? 0 : parseInt(valStr, 10);
                          handleCustomChange(isNaN(val) ? 0 : val, minutes);
                        }}
                        inputProps={{ min: 0 }}
                        sx={{
                          width: 50,
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            backgroundColor: '#FFFFFF',
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                          },
                          '& input': { textAlign: 'center', padding: '0 4px' },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                        hr
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={minutes === 0 && !preset.enabled ? '' : minutes}
                        placeholder="0"
                        onChange={e => {
                          const valStr = e.target.value;
                          const val = valStr === '' ? 0 : parseInt(valStr, 10);
                          handleCustomChange(hours, isNaN(val) ? 0 : val);
                        }}
                        inputProps={{ min: 0, max: 59 }}
                        sx={{
                          width: 50,
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            backgroundColor: '#FFFFFF',
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                          },
                          '& input': { textAlign: 'center', padding: '0 4px' },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                        min
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Checkbox
                  checked={preset.enabled}
                  onChange={e => handleToggleEnabled(index, e.target.checked)}
                  size="small"
                  sx={{
                    padding: 0,
                    color: '#CBD5E1',
                    '&.Mui-checked': {
                      color: '#3B82F6',
                    },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

export default QuickLockoutTab;
