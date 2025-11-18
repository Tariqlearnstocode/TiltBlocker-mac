import React from 'react';
import {
  Box,
  Card,
  Slide,
  Backdrop,
  Typography,
  Chip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import BlocklistTab from './tabs/BlocklistTab';
import EmergencyTab from './tabs/EmergencyTab';
import LockoutTab from './tabs/LockoutTab';

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
  
  // Lockout Modal props
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  customDuration: { hours: number; minutes: number };
  onCustomDurationChange: (duration: { hours: number; minutes: number }) => void;
  onLockoutConfirm: () => void;
  isLockoutActive: boolean;
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
  tempPassword,
  onTempPasswordChange,
  onSavePassword,
  onEmergencyUnblock,
  selectedDuration,
  onDurationChange,
  customDuration,
  onCustomDurationChange,
  onLockoutConfirm,
  isLockoutActive
}) => {
  console.log('SettingsModal isLockoutActive:', isLockoutActive);
  console.log('SettingsModal open:', open);
  if (!open) return null;

  return (
    <>
      <Backdrop open={true} sx={{ zIndex: 1000, backgroundColor: 'rgba(30, 41, 59, 0.8)' }} />
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Card
          className="draggable-card"
          sx={{
            position: 'fixed',
            top: hasMoved ? `${windowPosition.y}px` : '50%',
            left: hasMoved ? `${windowPosition.x}px` : '50%',
            transform: hasMoved ? 'none' : 'translate(-50%, -50%)',
            width: 580,
            maxHeight: '80vh',
            zIndex: 9999,
            background: '#FFFFFF',
            borderRadius: '20px',
            border: 'none',
            boxShadow: isDragging ? '0 8px 32px rgba(30, 41, 59, 0.25)' : '0 4px 20px rgba(30, 41, 59, 0.10)',
            overflow: 'hidden',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
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
              <LockoutTab
                selectedDuration={selectedDuration}
                onDurationChange={onDurationChange}
                customDuration={customDuration}
                onCustomDurationChange={onCustomDurationChange}
                onLockoutConfirm={onLockoutConfirm}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <EmergencyTab
                tempPassword={tempPassword}
                onTempPasswordChange={onTempPasswordChange}
                onSavePassword={onSavePassword}
                onEmergencyUnblock={onEmergencyUnblock}
                isActiveBlockingTime={false}
                rulesCount={rules.length}
              />
            </TabPanel>
          </Box>
        </Card>
      </Slide>
    </>
  );
};

export default SettingsModal; 