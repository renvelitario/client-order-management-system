import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountShell from '../../components/account/AccountShell';
import Notification from '../../components/ui/Notification';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import api from '../../utils/api';
import {
  LAST_ACTIVITY_STORAGE_KEY,
  MAX_INACTIVITY_MINUTES,
  MIN_INACTIVITY_MINUTES,
  WARNING_LEAD_MINUTES,
  setStoredInactivityDurationMinutes,
  setStoredSessionTimeoutEnabled,
} from '../../utils/inactivity';
import { resolveApiErrorMessage } from '../../types/app';

type DeviceSession = {
  device_id: string;
  device_label: string | null;
  user_agent: string;
  timezone: string | null;
  last_ip: string | null;
  first_seen_at: string;
  last_seen_at: string;
  is_current: boolean;
  is_active: boolean;
};

type DeviceSessionsResponse = {
  devices: DeviceSession[];
  total_devices: number;
  active_devices: number;
};

const formatLastActivity = (value: string | null): string => {
  if (!value) return 'No activity captured yet';

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 'No activity captured yet';

  return new Date(parsed).toLocaleString();
};

const AccountSessions = () => {
  const navigate = useNavigate();
  const { localUser, refreshLocalUser } = useAuth();
  const [inactivityMinutes, setInactivityMinutes] = useState<number>(localUser?.inactivity_timeout_minutes ?? 60);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState<boolean>(localUser?.session_timeout_enabled ?? true);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [activeDevices, setActiveDevices] = useState(0);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [deviceActionId, setDeviceActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const lastActivityLabel = useMemo(
    () => formatLastActivity(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)),
    [],
  );

  useEffect(() => {
    setInactivityMinutes(localUser?.inactivity_timeout_minutes ?? 60);
    setSessionTimeoutEnabled(localUser?.session_timeout_enabled ?? true);
  }, [localUser?.inactivity_timeout_minutes, localUser?.session_timeout_enabled]);

  const loadDevices = async () => {
    try {
      setIsLoadingDevices(true);
      const { data } = await api.get<DeviceSessionsResponse>('/auth/session-devices');
      setDevices(data.devices || []);
      setTotalDevices(data.total_devices || 0);
      setActiveDevices(data.active_devices || 0);
    } catch (loadError) {
      setError(resolveApiErrorMessage(loadError, 'Unable to load signed-in devices.'));
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const saveTimeout = async () => {
    setError('');
    setSuccess('');

    if (inactivityMinutes < MIN_INACTIVITY_MINUTES || inactivityMinutes > MAX_INACTIVITY_MINUTES) {
      setError(`Timeout must be between ${MIN_INACTIVITY_MINUTES} and ${MAX_INACTIVITY_MINUTES} minutes.`);
      return;
    }

    try {
      setIsSaving(true);
      await api.put('/auth/session-timeout', {
        session_timeout_enabled: sessionTimeoutEnabled,
        ...(sessionTimeoutEnabled ? { inactivity_timeout_minutes: inactivityMinutes } : {}),
      });
      setStoredInactivityDurationMinutes(inactivityMinutes);
      setStoredSessionTimeoutEnabled(sessionTimeoutEnabled);
      await refreshLocalUser();
      setSuccess('Session timeout preferences were saved.');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to save session timeout.'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeDevice = async (deviceId: string, isCurrent: boolean) => {
    setError('');
    setSuccess('');

    if (isCurrent) {
      setError('Current device cannot be removed from the device list.');
      return;
    }

    if (!window.confirm('Remove this device from tracked sessions?')) {
      return;
    }

    try {
      setDeviceActionId(deviceId);
      await api.delete(`/auth/session-devices/${encodeURIComponent(deviceId)}`);
      await loadDevices();
      setSuccess('Device removed from tracked sessions.');
    } catch (deviceError) {
      setError(resolveApiErrorMessage(deviceError, 'Unable to remove this device.'));
    } finally {
      setDeviceActionId(null);
    }
  };

  const signOutCurrentDevice = async () => {
    setError('');
    setSuccess('');

    if (!window.confirm('Sign out from this device now?')) {
      return;
    }

    try {
      setIsSigningOut(true);
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/login');
    } catch (err) {
      setError(resolveApiErrorMessage(err, 'Failed to log out this session.'));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AccountShell
      title="Sessions"
      description="Control session timeout policy and monitor basic account activity signals."
    >
      <article className="account-card">
        <h2>Session Timeout Policy</h2>
        <p className="account-note">
          Configure if auto-logout should run for your account sessions.
        </p>

        <div className="account-form">
          <label className="account-checkbox-row" htmlFor="session-timeout-enabled">
            <input
              id="session-timeout-enabled"
              type="checkbox"
              checked={sessionTimeoutEnabled}
              onChange={(event) => setSessionTimeoutEnabled(event.target.checked)}
            />
            <span>Enable auto-logout after inactivity</span>
          </label>

          <label htmlFor="session-timeout-minutes">Auto-logout after inactivity (minutes)</label>
          <input
            id="session-timeout-minutes"
            type="number"
            min={MIN_INACTIVITY_MINUTES}
            max={MAX_INACTIVITY_MINUTES}
            value={inactivityMinutes}
            onChange={(event) => setInactivityMinutes(Number(event.target.value || MIN_INACTIVITY_MINUTES))}
            disabled={!sessionTimeoutEnabled}
          />

          <p className="account-note account-note--compact">
            {sessionTimeoutEnabled
              ? `Warning appears ${WARNING_LEAD_MINUTES} minutes before auto-logout.`
              : 'Auto-logout is disabled. Sessions stay signed in until explicit logout.'}
          </p>

          <button type="button" className="create-button" onClick={saveTimeout} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Timeout Policy'}
          </button>
        </div>

        <Notification message={success} type="success" />
        <Notification message={error} type="error" />
      </article>

      <article className="account-card account-card--read-only">
        <h2>Session Activity</h2>
        <dl className="account-kv-list">
          <div><dt>Last Recorded Activity</dt><dd>{lastActivityLabel}</dd></div>
          <div><dt>Tracked Devices</dt><dd>{totalDevices}</dd></div>
          <div><dt>Active Devices</dt><dd>{activeDevices}</dd></div>
          <div><dt>Current Timeout</dt><dd>{sessionTimeoutEnabled ? `${localUser?.inactivity_timeout_minutes || inactivityMinutes} min` : 'Disabled'}</dd></div>
          <div><dt>Warning Lead</dt><dd>{WARNING_LEAD_MINUTES} min</dd></div>
        </dl>

        <button type="button" className="delete-button" onClick={signOutCurrentDevice} disabled={isSigningOut}>
          {isSigningOut ? 'Signing out...' : 'Sign Out This Device'}
        </button>
      </article>

      <article className="account-card account-card--devices">
        <div className="account-device-header">
          <h2>Signed-In Devices</h2>
          <button type="button" className="edit-button" onClick={loadDevices} disabled={isLoadingDevices}>
            {isLoadingDevices ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {devices.length === 0 ? (
          <p className="account-note">No tracked devices found yet.</p>
        ) : (
          <ul className="account-device-list">
            {devices.map((device) => (
              <li key={device.device_id} className="account-device-item">
                <div className="account-device-meta">
                  <strong>{device.device_label || 'Unnamed Device'}</strong>
                  <span>{device.user_agent}</span>
                  <span>
                    Last seen: {new Date(device.last_seen_at).toLocaleString()} {device.is_active ? '(Active)' : '(Idle)'}
                  </span>
                </div>
                <div className="account-device-actions">
                  {device.is_current ? (
                    <span className="account-device-current">Current</span>
                  ) : (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removeDevice(device.device_id, device.is_current)}
                      disabled={deviceActionId === device.device_id}
                    >
                      {deviceActionId === device.device_id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </AccountShell>
  );
};

export default AccountSessions;
