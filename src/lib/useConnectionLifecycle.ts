'use client';

/**
 * useConnectionLifecycle — Generic connection state machine hook.
 *
 * Encapsulates: disconnected→connecting→connected lifecycle, token fetch +
 * scheduled refresh, auto-reconnect with fresh token on unexpected disconnect,
 * idle-timeout teardown, and ref-based cleanup on unmount.
 *
 * Consumers provide protocol-specific callbacks (fetchToken, createClient,
 * connectClient, destroyClient) and get back connection state, controls, and
 * a typed client ref.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────

export type LifecycleConnectionState = 'disconnected' | 'connecting' | 'connected';

/** Granular phase within the 'connecting' state. */
export type ConnectionPhase = 'idle' | 'token' | 'socket' | 'setup';

export interface TokenData {
  token: string;
  /** Absolute expiry timestamp (ms since epoch). */
  expiresAt?: number;
  /** Token lifetime in ms (used when expiresAt is not provided). */
  expiresInMs?: number;
}

export interface ConnectionLifecycleConfig<TClient, TParams = void> {
  /** Fetch a connection token / credential. Called on connect and for refresh. */
  fetchToken: (params: TParams) => Promise<TokenData>;

  /** Create the underlying client instance. Called once per connect cycle. */
  createClient: (params: TParams) => TClient;

  /** Connect the client with a token. Also called during auto-reconnect. */
  connectClient: (client: TClient, token: string, params: TParams) => void;

  /** Tear down the client instance and release resources. */
  destroyClient: (client: TClient) => void;

  /**
   * Subscribe to raw client state changes.
   * Must invoke handler with 'connecting' | 'connected' | 'disconnected' | 'reconnecting'.
   * Return an unsubscribe function if applicable.
   */
  subscribeToState: (
    client: TClient,
    handler: (state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void,
  ) => (() => void) | void;

  /**
   * Subscribe to a "ready" signal (e.g., WebSocket setup-complete).
   * If omitted, onReadyRef fires when state becomes 'connected'.
   */
  subscribeToReady?: (
    client: TClient,
    handler: () => void,
  ) => (() => void) | void;

  /** Idle disconnect timeout in ms. 0 or omitted = disabled. */
  idleTimeoutMs?: number;

  /** Ms before token expiry to schedule a refresh. Default: 300 000 (5 min). */
  tokenRefreshBufferMs?: number;

  /** Auto-reconnect on unexpected disconnect. Default: true. */
  autoReconnect?: boolean;
}

export interface ConnectionLifecycleReturn<TClient, TParams = void> {
  /** Current connection state. */
  connectionState: LifecycleConnectionState;

  /** Granular phase within the 'connecting' state (token → socket → setup). */
  connectionPhase: ConnectionPhase;

  /** Ref that always reflects the latest connectionState (safe in callbacks). */
  connectionStateRef: React.RefObject<LifecycleConnectionState>;

  /** Initiate a connection. Resolves once the client is created and connectClient called. */
  connect: (params: TParams) => Promise<void>;

  /** Manually disconnect and clean up all resources. */
  disconnect: () => void;

  /** Clear the idle timer (call when activity starts). */
  resetIdleTimer: () => void;

  /** Start the idle disconnect countdown (call when activity stops). */
  startIdleTimer: () => void;

  /** Ref to the underlying client for consumer-level event access. */
  clientRef: React.RefObject<TClient | null>;

  /**
   * One-shot callback ref — set before calling connect() to queue
   * an action that fires once when the connection becomes ready.
   * Auto-cleared after invocation.
   */
  onReadyRef: React.MutableRefObject<(() => void) | null>;
}

// ─── Default token refresh buffer ───────────────────────

const DEFAULT_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5_000;
const DEFAULT_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

// ─── Hook ───────────────────────────────────────────────

export function useConnectionLifecycle<TClient, TParams = void>(
  config: ConnectionLifecycleConfig<TClient, TParams>,
): ConnectionLifecycleReturn<TClient, TParams> {
  const [connectionState, setConnectionState] = useState<LifecycleConnectionState>('disconnected');
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');

  // Refs
  const clientRef = useRef<TClient | null>(null);
  const onReadyRef = useRef<(() => void) | null>(null);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenExpiresAtRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastParamsRef = useRef<TParams | null>(null);
  const manualDisconnectRef = useRef(false);
  const stateUnsubRef = useRef<(() => void) | null>(null);
  const readyUnsubRef = useRef<(() => void) | null>(null);

  // Always-fresh config ref (avoids stale closures in timer callbacks)
  const configRef = useRef(config);
  configRef.current = config;

  // Ref mirror for connectionState (safe to read in async/timer callbacks)
  const connectionStateRef = useRef<LifecycleConnectionState>(connectionState);
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  // ── Helpers ──

  const computeExpiresAt = useCallback((data: TokenData): number => {
    if (data.expiresAt) return data.expiresAt;
    if (data.expiresInMs) return Date.now() + data.expiresInMs;
    return Date.now() + DEFAULT_TOKEN_LIFETIME_MS;
  }, []);

  const scheduleTokenRefresh = useCallback(
    (expiresAt: number, params: TParams) => {
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);

      const buffer = configRef.current.tokenRefreshBufferMs ?? DEFAULT_REFRESH_BUFFER_MS;
      const refreshIn = Math.max(MIN_REFRESH_DELAY_MS, expiresAt - Date.now() - buffer);

      tokenRefreshTimerRef.current = setTimeout(() => {
        configRef.current
          .fetchToken(params)
          .then((fresh) => {
            tokenExpiresAtRef.current = computeExpiresAt(fresh);
          })
          .catch(() => {
            // Ignore — reconnect path will request another token
          });
      }, refreshIn);
    },
    [computeExpiresAt],
  );

  // ── Teardown ──

  const teardown = useCallback(() => {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    stateUnsubRef.current?.();
    stateUnsubRef.current = null;
    readyUnsubRef.current?.();
    readyUnsubRef.current = null;

    if (clientRef.current) {
      configRef.current.destroyClient(clientRef.current);
      clientRef.current = null;
    }
    tokenExpiresAtRef.current = null;
  }, []);

  // ── Disconnect ──

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    teardown();
    setConnectionState('disconnected');
    setConnectionPhase('idle');
  }, [teardown]);

  // ── Idle timer ──

  const startIdleTimer = useCallback(() => {
    const timeout = configRef.current.idleTimeoutMs;
    if (!timeout) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      disconnect();
    }, timeout);
  }, [disconnect]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // ── Connect ──

  const connect = useCallback(
    async (params: TParams) => {
      if (connectionStateRef.current !== 'disconnected') return;

      manualDisconnectRef.current = false;
      setConnectionState('connecting');
      setConnectionPhase('token');
      lastParamsRef.current = params;

      const cfg = configRef.current;

      const tokenData = await cfg.fetchToken(params);
      const expiresAt = computeExpiresAt(tokenData);
      tokenExpiresAtRef.current = expiresAt;

      // Token fetched — move to socket phase
      setConnectionPhase('socket');

      const client = cfg.createClient(params);
      clientRef.current = client;

      // Subscribe to state changes
      const unsub = cfg.subscribeToState(client, (state) => {
        if (state === 'connected') {
          setConnectionState('connected');
          // If there's a subscribeToReady, wait for setup phase;
          // otherwise transition straight to idle (fully connected).
          if (configRef.current.subscribeToReady) {
            setConnectionPhase('setup');
          } else {
            setConnectionPhase('idle');
            const cb = onReadyRef.current;
            if (cb) {
              onReadyRef.current = null;
              cb();
            }
          }
        } else if (state === 'disconnected') {
          setConnectionState('disconnected');
          setConnectionPhase('idle');

          // Auto-reconnect (only on unexpected disconnect)
          const autoReconnect = configRef.current.autoReconnect ?? true;
          if (autoReconnect && !manualDisconnectRef.current && lastParamsRef.current !== null) {
            const reconnectParams = lastParamsRef.current;
            setConnectionPhase('token');
            configRef.current
              .fetchToken(reconnectParams)
              .then((fresh) => {
                tokenExpiresAtRef.current = computeExpiresAt(fresh);
                setConnectionPhase('socket');
                if (clientRef.current) {
                  configRef.current.connectClient(clientRef.current, fresh.token, reconnectParams);
                }
              })
              .catch(() => {
                setConnectionPhase('idle');
                // Stay disconnected if refresh fails
              });
          }
        } else if (state === 'connecting' || state === 'reconnecting') {
          setConnectionState('connecting');
        }
      });
      if (unsub) stateUnsubRef.current = unsub;

      // Subscribe to ready signal
      if (cfg.subscribeToReady) {
        const readyUnsub = cfg.subscribeToReady(client, () => {
          setConnectionPhase('idle');
          const cb = onReadyRef.current;
          if (cb) {
            onReadyRef.current = null;
            cb();
          }
        });
        if (readyUnsub) readyUnsubRef.current = readyUnsub;
      }

      // Initiate connection
      cfg.connectClient(client, tokenData.token, params);

      // Schedule token refresh
      scheduleTokenRefresh(expiresAt, params);
    },
    [computeExpiresAt, scheduleTokenRefresh],
  );

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return {
    connectionState,
    connectionPhase,
    connectionStateRef,
    connect,
    disconnect,
    resetIdleTimer,
    startIdleTimer,
    clientRef,
    onReadyRef,
  };
}
