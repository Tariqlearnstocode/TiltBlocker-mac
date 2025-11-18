import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import BlocklistTab from './tabs/BlocklistTab';
import EmergencyTab from './tabs/EmergencyTab';
import QuickLockoutTab, { QuickLockoutPreset } from './tabs/QuickLockoutTab';
import LockoutModal from './LockoutModal';

interface BlockRule {
  id: string;
  name: string;
  urlPatterns: string[];
  enabled: boolean;
  createdAt: string;
}

interface ServiceStatus {
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  rulesCount: number;
}



interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  serviceStatus: ServiceStatus | null;
  tabValue: number;
  onTabChange: (value: number) => void;
  
  // Drag props
  isDragging: boolean;
  hasMoved: boolean;
  windowPosition: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  
  // Quick Block Tab props
  newUrl: string;
  onUrlChange: (url: string) => void;
  onAddUrl: (url: string) => void;
  onAddMultipleUrls: (urls: string[]) => void;
  onDeleteRule: (ruleId: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  loading: boolean;
  error: string | null;
  rules: BlockRule[];
  onClearError: () => void;
  onClearAllRules: () => void;
  
  // Common Sites Tab props
  // (uses onAddUrl from Quick Block Tab props)
  

  
  // Emergency Tab props
  tempPassword: string;
  onTempPasswordChange: (password: string) => void;
  onSavePassword: () => void;
  onEmergencyUnblock: () => void;
  savedEmergencyPassword: string;
  
  // Lockout Modal props
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  customDuration: { hours: number; minutes: number };
  onCustomDurationChange: (duration: { hours: number; minutes: number }) => void;
  selectedSession: string;
  onSessionChange: (session: string) => void;
  onLockoutConfirm: () => void;
  isLockoutActive: boolean;
  quickLockouts: QuickLockoutPreset[];
  onQuickLockoutsChange: (presets: QuickLockoutPreset[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  serviceStatus,
  tabValue,
  onTabChange,
  isDragging,
  hasMoved,
  windowPosition,
  onMouseDown,
  newUrl,
  onUrlChange,
  onAddUrl,
  onAddMultipleUrls,
  onDeleteRule,
  onKeyPress,
  loading,
  error,
  rules,
  onClearError,
  onClearAllRules,
  tempPassword,
  onTempPasswordChange,
  onSavePassword,
  onEmergencyUnblock,
  savedEmergencyPassword,
  selectedDuration,
  onDurationChange,
  customDuration,
  onCustomDurationChange,
  selectedSession,
  onSessionChange,
  onLockoutConfirm,
  isLockoutActive,
  quickLockouts,
  onQuickLockoutsChange
}) => {
  console.log('SettingsModal isLockoutActive:', isLockoutActive);
  console.log('SettingsModal open:', open);
  if (!open) return null;

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
          boxShadow: '0 4px 20px rgba(27, 31, 59, 0.1)',
          border: 'none',
          maxHeight: '80vh',
          overflow: 'hidden',
        },
      }}
    >
          {/* Header */}
          <Box
            sx={{
              background: '#1E293B',
              color: 'white',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              transition: isDragging ? 'none' : 'background 0.2s ease',
            }}
            onMouseDown={onMouseDown}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <DragIcon sx={{ opacity: 0.7, fontSize: 20 }} />
              <SettingsIcon sx={{ fontSize: 20 }} />
              <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem', color: '#FFFFFF' }}>
                TraderBlock Settings
              </Typography>
              <Chip
                size="small"
                label={isLockoutActive ? '🔒 Lockout Active' : '✓ Ready'}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  backgroundColor: isLockoutActive ? '#FF6B35' : '#00C896',
                  color: '#FFFFFF',
                  border: 'none',
                  '& .MuiChip-label': {
                    paddingX: '8px',
                  }
                }}
              />
            </Box>
            <Box>
              <IconButton 
                size="small" 
                onClick={onClose} 
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => onTabChange(newValue)}
            sx={{ 
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              minHeight: 0,
              '& .MuiTab-root': {
                minHeight: 0,
                minWidth: 0,
                padding: '0 20px',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: '#64748B',
                letterSpacing: 0,
                lineHeight: 1.2,
                height: 40,
                '&.Mui-selected': {
                  color: '#3B82F6',
                  fontWeight: 700,
                  background: '#FFFFFF',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3B82F6',
                height: '3px',
                borderRadius: '2px 2px 0 0',
              },
            }}
            TabIndicatorProps={{ style: { height: 3, borderRadius: '2px 2px 0 0' } }}
            variant="fullWidth"
          >
            <Tab label="Blocklist" disableRipple />
            <Tab label="Lockout" disableRipple />
            <Tab label="Quick Lockout" disableRipple />
            <Tab label="Emergency" disableRipple />
          </Tabs>

          {/* Tab Panels */}
          <Box sx={{ maxHeight: '60vh', overflow: 'auto', backgroundColor: '#FFFFFF' }}>
            <TabPanel value={tabValue} index={0}>
              <BlocklistTab
                loading={loading}
                onAddUrl={onAddUrl}
                onAddMultipleUrls={onAddMultipleUrls}
                newUrl={newUrl}
                onUrlChange={onUrlChange}
                onDeleteRule={onDeleteRule}
                onKeyPress={onKeyPress}
                error={error}
                rules={rules}
                onClearError={onClearError}
                onClearAllRules={onClearAllRules}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <LockoutModal
                open={true}
                onClose={onClose}
                onSettingsClick={() => onTabChange(0)}
                onConfirm={onLockoutConfirm}
                selectedDuration={selectedDuration}
                onDurationChange={onDurationChange}
                customDuration={customDuration}
                onCustomDurationChange={onCustomDurationChange}
                blockedSites={rules.map(rule => rule.urlPatterns).flat()}
                selectedSession={selectedSession}
                onSessionChange={onSessionChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <QuickLockoutTab
                presets={quickLockouts}
                onChange={onQuickLockoutsChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <EmergencyTab
                tempPassword={tempPassword}
                onTempPasswordChange={onTempPasswordChange}
                onSavePassword={onSavePassword}
                onEmergencyUnblock={onEmergencyUnblock}
                savedEmergencyPassword={savedEmergencyPassword}
                isActiveBlockingTime={false}
                rulesCount={rules.length}
              />
            </TabPanel>
          </Box>
    </Dialog>
  );
};

export default SettingsModal; 