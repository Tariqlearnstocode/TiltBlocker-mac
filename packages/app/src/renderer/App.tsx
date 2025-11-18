import React, { useState, useEffect } from 'react';
import { Box, Fab } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';
import LockoutModal from './components/LockoutModal';
import SettingsModal from './components/SettingsModal';
import EmergencyDialog from './components/EmergencyDialog';
import LockoutActiveScreen from './components/LockoutActiveScreen';

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

function App() {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLockoutActive, setIsLockoutActive] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showLockoutModal, setShowLockoutModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  

  
  // Emergency dialog
  const [emergencyDialog, setEmergencyDialog] = useState(false);
  const [emergencyPassword, setEmergencyPassword] = useState('');
  const [savedEmergencyPassword, setSavedEmergencyPassword] = useState('trader123');
  const [tempPassword, setTempPassword] = useState('');

  // Lockout state
  const [selectedDuration, setSelectedDuration] = useState('');
  const [customDuration, setCustomDuration] = useState({ hours: 0, minutes: 15 });
  const [selectedSession, setSelectedSession] = useState('');
  const [userTimezone, setUserTimezone] = useState('America/Chicago'); // Default to CT

  const API_BASE = 'http://localhost:3001';

  // Get session duration helper
  const getSessionDuration = (sessionKey: string): number => {
    const sessions = {
      'NEW_YORK': { endHour: 16 },
      'LONDON': { endHour: 11 },
      'TOKYO': { endHour: 3 },
      'SYDNEY': { endHour: 1 }
    };
    
    const session = sessions[sessionKey as keyof typeof sessions];
    if (!session) return 0;
    
    // Get current time in CT
    const nowCT = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Chicago"}));
    
    // Create end time in CT
    const endTimeCT = new Date(nowCT);
    endTimeCT.setHours(session.endHour, 0, 0, 0);
    
    // If end time is next day (for Tokyo/Sydney that end early morning)
    if (session.endHour < 12 && nowCT.getHours() >= 12) {
      endTimeCT.setDate(endTimeCT.getDate() + 1);
    }
    
    return Math.max(0, endTimeCT.getTime() - nowCT.getTime());
  };

  // Handle FAB click - show lockout modal
  const handleFabClick = () => {
    setShowLockoutModal(true);
  };

  // Handle settings button - show settings interface
  const handleSettingsClick = () => {
    setShowLockoutModal(false);
    setShowSettings(true);
  };

  // Handle lockout confirmation - start blocking service
  const handleLockoutConfirm = async () => {
    try {
      setLoading(true);
      
      // Get duration in milliseconds
      let durationMs = 0;
      
      if (selectedSession) {
        // Calculate session end time
        durationMs = getSessionDuration(selectedSession);
      } else if (selectedDuration === 'CUSTOM') {
        durationMs = (customDuration.hours * 60 + customDuration.minutes) * 60 * 1000;
      } else {
        const durationMap: Record<string, number> = {
          '15 MIN': 15 * 60 * 1000,
          '30 MIN': 30 * 60 * 1000,
          '1 HOUR': 60 * 60 * 1000,
          'ALL DAY': 24 * 60 * 60 * 1000,
          '30 DAYS': 30 * 24 * 60 * 60 * 1000
        };
        durationMs = durationMap[selectedDuration] || 0;
      }

      // Start lockout with current blocklist
      const response = await fetch(`${API_BASE}/start-lockout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: durationMs,
          sites: rules.map(rule => rule.urlPatterns).flat()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const endTime = new Date(data.lockoutEndTime);
        setIsLockoutActive(true);
        setLockoutEndTime(endTime);
        setShowLockoutModal(false);
        setSelectedDuration('');
        setSelectedSession('');
        
        // No need for frontend timer - server handles auto-stop
      } else {
        setError('Failed to start lockout');
      }
    } catch (err) {
      setError('Failed to start lockout');
      console.error('Lockout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = e.currentTarget.closest('.draggable-card')?.getBoundingClientRect();
    if (rect && !hasMoved) {
      setWindowPosition({
        x: rect.left,
        y: rect.top
      });
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    } else {
      setDragOffset({
        x: e.clientX - windowPosition.x,
        y: e.clientY - windowPosition.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - 480;
      const maxY = window.innerHeight - 200;
      
      setWindowPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
      setHasMoved(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Fetch service status and lockout state
  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        setServiceStatus({
          status: 'running',
          uptime: data.uptime,
          rulesCount: data.rulesCount || 0
        });
        
        // Check if lockout is active
        if (data.lockoutActive && data.lockoutEndTime) {
          const endTime = new Date(data.lockoutEndTime);
          const now = new Date();
          
          // Only set lockout active if it hasn't expired
          if (endTime > now) {
            setIsLockoutActive(true);
            // Only update state if the time is different
            if (lockoutEndTime?.getTime() !== endTime.getTime()) {
              setLockoutEndTime(endTime);
            }
          } else {
            // Lockout has expired, clear it
            setIsLockoutActive(false);
            setLockoutEndTime(null);
          }
        } else {
          setIsLockoutActive(false);
          setLockoutEndTime(null);
        }
      }
    } catch (err) {
      setServiceStatus({ status: 'error', uptime: 0, rulesCount: 0 });
    }
  };

  // Load rules from localStorage
  const loadRules = () => {
    try {
      const stored = localStorage.getItem('traderBlockRules');
      if (stored) {
        const rules = JSON.parse(stored);
        setRules(Array.isArray(rules) ? rules : []);
      }
      
      // Load timezone setting
      const storedTimezone = localStorage.getItem('traderBlockTimezone');
      if (storedTimezone) {
        setUserTimezone(storedTimezone);
      }
    } catch (err) {
      console.error('Failed to load rules from localStorage:', err);
      setError('Failed to load rules');
    }
  };

  // Save rules to localStorage
  const saveRules = (newRules: BlockRule[]) => {
    try {
      localStorage.setItem('traderBlockRules', JSON.stringify(newRules));
      setRules(newRules);
    } catch (err) {
      console.error('Failed to save rules to localStorage:', err);
      setError('Failed to save rules');
    }
  };

  // Save timezone setting
  const handleTimezoneChange = (timezone: string) => {
    setUserTimezone(timezone);
    localStorage.setItem('traderBlockTimezone', timezone);
  };

  // Handle duration selection (clear session selection)
  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
    setSelectedSession(''); // Clear session when duration is selected
  };

  // Handle session selection (clear duration selection)
  const handleSessionChange = (session: string) => {
    setSelectedSession(session);
    setSelectedDuration(''); // Clear duration when session is selected
  };

  // Add new rule to blocklist (localStorage only)
  const handleAddUrl = (url: string) => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newRule: BlockRule = {
        id: Date.now().toString(),
        name: `Block ${url}`,
        urlPatterns: [url.trim()],
        enabled: true,
        createdAt: new Date().toISOString()
      };

      const updatedRules = [...rules, newRule];
      saveRules(updatedRules);
        setNewUrl('');
    } catch (err) {
      setError('Failed to add URL');
    } finally {
      setLoading(false);
    }
  };

  // Add multiple rules at once (used by "Block All")
  const handleAddMultipleUrls = (urls: string[]) => {
    const cleaned = urls
      .map(u => u.trim())
      .filter(Boolean);
    if (cleaned.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const existingPatterns = new Set(
        rules.flatMap(rule =>
          (rule.urlPatterns || []).map(p => p.trim().toLowerCase())
        )
      );

      const nowIso = new Date().toISOString();
      const baseTimestamp = Date.now();

      const newRules: BlockRule[] = [];
      cleaned.forEach((url, index) => {
        const lower = url.toLowerCase();
        if (existingPatterns.has(lower)) return;

        newRules.push({
          id: `${baseTimestamp}-${index}`,
          name: `Block ${url}`,
          urlPatterns: [url],
          enabled: true,
          createdAt: nowIso
        });
      });

      if (newRules.length === 0) return;

      const updatedRules = [...rules, ...newRules];
      saveRules(updatedRules);
    } catch (err) {
      console.error('Failed to add URLs', err);
      setError('Failed to add URLs');
    } finally {
      setLoading(false);
    }
  };
  // Delete rule from blocklist (localStorage only)
  const handleDeleteRule = (ruleId: string) => {
    try {
      const updatedRules = rules.filter(rule => rule.id !== ruleId);
      saveRules(updatedRules);
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  // Clear entire blocklist
  const handleClearAllRules = () => {
    try {
      saveRules([]);
    } catch (err) {
      console.error('Failed to clear blocklist', err);
      setError('Failed to clear blocklist');
    }
  };

  // Emergency unblock - stop active lockout
  const handleEmergencyUnblock = async () => {
    if (emergencyPassword === savedEmergencyPassword) {
      if (isLockoutActive) {
        try {
          await fetch(`${API_BASE}/stop-lockout`, { method: 'POST' });
          setIsLockoutActive(false);
          setLockoutEndTime(null);
        } catch (err) {
          console.error('Failed to stop lockout:', err);
        }
      }
      setEmergencyDialog(false);
      setEmergencyPassword('');
    } else {
      setError('Invalid emergency password');
    }
  };

  // Extend lockout duration
  const handleExtendLockout = async (additionalMinutes: number) => {
    if (!lockoutEndTime) return;
    
    try {
      const response = await fetch(`${API_BASE}/extend-lockout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalMinutes }),
      });

      if (response.ok) {
        const data = await response.json();
        setLockoutEndTime(new Date(data.newLockoutEndTime));
      } else {
        setError('Failed to extend lockout');
      }
    } catch (err) {
      setError('Failed to extend lockout');
      console.error('Extend lockout error:', err);
    }
  };

  // Emergency unlock from lockout screen
  const handleEmergencyUnlockFromScreen = async () => {
    try {
      await fetch(`${API_BASE}/stop-lockout`, { method: 'POST' });
      setIsLockoutActive(false);
      setLockoutEndTime(null);
    } catch (err) {
      console.error('Failed to emergency unlock:', err);
      setError('Failed to unlock');
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUrl(newUrl);
    }
  };



  useEffect(() => {
    fetchStatus();
    loadRules();

    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Show lockout active screen when locked out
  if (isLockoutActive) {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(27, 31, 59, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(27, 31, 59, 0.1)',
            }}
          >
            <LockoutActiveScreen
              lockoutEndTime={lockoutEndTime}
              onExtend={handleExtendLockout}
              onEmergencyUnlock={handleEmergencyUnlockFromScreen}
              blockedSites={rules.map(rule => rule.urlPatterns).flat()}
            />
          </Box>
        </Box>
      </>
    );
  }

  if (isMinimized && !showSettings) {
    return (
      <>
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <Fab
          color="primary"
            onClick={handleFabClick}
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
      </Box>

        <LockoutModal
          open={showLockoutModal}
          onClose={() => setShowLockoutModal(false)}
          onSettingsClick={handleSettingsClick}
          onConfirm={handleLockoutConfirm}
          selectedDuration={selectedDuration}
          onDurationChange={handleDurationChange}
          customDuration={customDuration}
          onCustomDurationChange={setCustomDuration}
          blockedSites={rules.map(rule => rule.urlPatterns).flat()}
          selectedSession={selectedSession}
          onSessionChange={handleSessionChange}
        />
      </>
    );
  }

  return (
    <>
      <EmergencyDialog
        open={emergencyDialog}
        onClose={() => setEmergencyDialog(false)}
        onConfirm={handleEmergencyUnblock}
        password={emergencyPassword}
        onPasswordChange={setEmergencyPassword}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        serviceStatus={serviceStatus}
        tabValue={tabValue}
        onTabChange={setTabValue}
        isDragging={isDragging}
        hasMoved={hasMoved}
        windowPosition={windowPosition}
        onMouseDown={handleMouseDown}
        newUrl={newUrl}
        onUrlChange={setNewUrl}
        onAddUrl={handleAddUrl}
        onAddMultipleUrls={handleAddMultipleUrls}
        onDeleteRule={handleDeleteRule}
        onKeyPress={handleKeyPress}
        loading={loading}
        error={error}
        rules={rules}
        onClearError={() => setError(null)}
        onClearAllRules={handleClearAllRules}
        tempPassword={tempPassword}
        onTempPasswordChange={setTempPassword}
        onSavePassword={() => setSavedEmergencyPassword(tempPassword)}
        onEmergencyUnblock={() => setEmergencyDialog(true)}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        customDuration={customDuration}
        onCustomDurationChange={setCustomDuration}
        onLockoutConfirm={handleLockoutConfirm}
        isLockoutActive={isLockoutActive}
      />
    </>
  );
}

export default App; 