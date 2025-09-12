import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase, USER_ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY, STORAGE_BUCKETS, DOCUMENT_STATUS } from '../lib/supabase';
import { createStorageBuckets } from '../utils/createStorageBuckets';
import { setupStoragePolicies } from '../utils/setupStoragePolicies';
import { setupDatabasePolicies, printDatabasePolicyInstructions } from '../utils/setupDatabasePolicies';
import { isCategoryRestricted } from '../constants/complaintCategories';

const AppContext = createContext();

// Local storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'traffic_app_user_profile',
  AUTH_STATE: 'traffic_app_auth_state'
};

// Helper functions for tab-scoped storage (sessionStorage)
const getStoredUserProfile = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading stored user profile:', error);
    return null;
  }
};

const setStoredUserProfile = (userProfile) => {
  try {
    if (userProfile) {
      sessionStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
  } catch (error) {
    console.error('Error storing user profile:', error);
  }
};

const getStoredAuthState = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading stored auth state:', error);
    return null;
  }
};

const setStoredAuthState = (authState) => {
  try {
    if (authState) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(authState));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    }
  } catch (error) {
    console.error('Error storing auth state:', error);
  }
};

// Initial state - check localStorage first for faster loading
const getInitialState = () => {
  const storedProfile = getStoredUserProfile();
  const storedAuthState = getStoredAuthState();
  
  // Check if cached data is recent (less than 30 minutes)
  const isRecentCache = storedAuthState && 
    (Date.now() - storedAuthState.timestamp) < (30 * 60 * 1000);
  
  return {
    currentUser: isRecentCache ? storedProfile : null,
    loading: false, // Start with false, will be set to true if needed
    complaints: [],
    documents: [],
    toasts: [],
    authLoading: false,
    profileLoading: false,
    isAuthRestored: isRecentCache, // If we have recent cache, consider auth restored immediately
    sessionCheckComplete: false, // Track if initial session check is done
    authInitialized: false, // Track if auth initialization is complete
    loadingTimeout: false, // Track if loading has timed out
    backgroundRefreshing: false, // Track background profile refresh
    profileFetchRetries: 0,
    maxRetries: 3
  };
};

const initialState = getInitialState();

// Action types
const actionTypes = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',
  SET_PROFILE_LOADING: 'SET_PROFILE_LOADING',
  SET_AUTH_RESTORED: 'SET_AUTH_RESTORED',
  SET_SESSION_CHECK_COMPLETE: 'SET_SESSION_CHECK_COMPLETE',
  SET_AUTH_INITIALIZED: 'SET_AUTH_INITIALIZED',
  SET_LOADING_TIMEOUT: 'SET_LOADING_TIMEOUT',
  SET_BACKGROUND_REFRESHING: 'SET_BACKGROUND_REFRESHING',
  SET_COMPLAINTS: 'SET_COMPLAINTS',
  ADD_COMPLAINT: 'ADD_COMPLAINT',
  UPDATE_COMPLAINT: 'UPDATE_COMPLAINT',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  LOGOUT: 'LOGOUT'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      // Persist user profile to localStorage
      setStoredUserProfile(action.payload);
      return {
        ...state,
        currentUser: action.payload,
        loading: false,
        profileLoading: false
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case actionTypes.SET_AUTH_LOADING:
      return {
        ...state,
        authLoading: action.payload
      };
      
    case actionTypes.SET_PROFILE_LOADING:
      return {
        ...state,
        profileLoading: action.payload
      };
      
    case actionTypes.SET_AUTH_RESTORED:
      return {
        ...state,
        isAuthRestored: action.payload
      };
      
    case actionTypes.SET_SESSION_CHECK_COMPLETE:
      return {
        ...state,
        sessionCheckComplete: action.payload
      };
      
    case actionTypes.SET_AUTH_INITIALIZED:
      return {
        ...state,
        authInitialized: action.payload
      };
      
    case actionTypes.SET_LOADING_TIMEOUT:
      return {
        ...state,
        loadingTimeout: action.payload
      };
      
    case actionTypes.SET_BACKGROUND_REFRESHING:
      return {
        ...state,
        backgroundRefreshing: action.payload
      };
    
    case actionTypes.SET_COMPLAINTS:
      return {
        ...state,
        complaints: action.payload
      };
    
    case actionTypes.ADD_COMPLAINT:
      return {
        ...state,
        complaints: [...state.complaints, action.payload]
      };
    
    case actionTypes.UPDATE_COMPLAINT:
      return {
        ...state,
        complaints: state.complaints.map(complaint => 
          complaint.id === action.payload.id 
            ? { ...complaint, ...action.payload.updates }
            : complaint
        )
      };
    
    case actionTypes.SET_DOCUMENTS:
      return {
        ...state,
        documents: action.payload
      };
    
    case actionTypes.ADD_DOCUMENT:
      return {
        ...state,
        documents: [...state.documents, action.payload]
      };
    
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };
    
    case actionTypes.LOGOUT:
      // Clear localStorage on logout
      setStoredUserProfile(null);
      setStoredAuthState(null);
      return {
        currentUser: null,
        loading: false,
        complaints: [],
        documents: [],
        toasts: [], // Clear toasts on logout
        authLoading: false,
        profileLoading: false,
        isAuthRestored: true, // Keep this true so we don't show loading screens
        sessionCheckComplete: true,
        authInitialized: true,
        loadingTimeout: false,
        backgroundRefreshing: false,
        profileFetchRetries: 0,
        maxRetries: 3
      };
    
    default:
      return state;
  }
};

// Context Provider Component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize auth session and user profile
  useEffect(() => {
    let isMounted = true;
    let initializationStarted = false;
    let timeoutId = null;
    // Track if we've already handled a sign-in for a given user to avoid duplicate fetches
    let handledSignInForUserId = null;

    // Unified session handler to make SIGNED_IN and INITIAL_SESSION idempotent
    const handleSessionAuth = async (event, session) => {
      if (!session?.user) return;
      const userId = session.user.id;

      // If we've already handled this user, skip duplicate handling
      if (handledSignInForUserId === userId && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('Auth event already handled for user:', userId, 'event:', event);
        return;
      }

      // Update auth state timestamp, but do not force any reloads
      setStoredAuthState({
        userId,
        email: session.user.email,
        timestamp: Date.now()
      });

      // Use cached user immediately if available to avoid UI blocking
      const cachedProfile = getStoredUserProfile();
      if (cachedProfile?.id === userId) {
        dispatch({ type: actionTypes.SET_USER, payload: cachedProfile });
      }

      // Fetch profile only if we have no cached user or IDs mismatch
      if (!cachedProfile || cachedProfile.id !== userId) {
        await fetchUserProfile(userId, false);
      }

      handledSignInForUserId = userId;
    };

    const initializeAuth = async () => {
      // Prevent duplicate initialization
      if (initializationStarted) {
        console.log('Authentication initialization already in progress, skipping...');
        return;
      }
      initializationStarted = true;
      
      try {
        console.log('Initializing authentication...');
        
        // Set a timeout to prevent infinite loading (5 seconds)
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Authentication initialization timeout - completing initialization');
            dispatch({ type: actionTypes.SET_AUTH_INITIALIZED, payload: true });
            dispatch({ type: actionTypes.SET_AUTH_RESTORED, payload: true });
            dispatch({ type: actionTypes.SET_SESSION_CHECK_COMPLETE, payload: true });
            
            // If we have cached data, use it; otherwise stay logged out
            const storedProfile = getStoredUserProfile();
            const storedAuthState = getStoredAuthState();
            const isRecentCache = storedAuthState && 
              (Date.now() - storedAuthState.timestamp) < (30 * 60 * 1000);
            
            if (isRecentCache && storedProfile) {
              console.log('Using cached profile due to timeout');
              dispatch({ type: actionTypes.SET_USER, payload: storedProfile });
            } else {
              console.log('No valid cached data, staying logged out');
              setStoredUserProfile(null);
              setStoredAuthState(null);
            }
          }
        }, 5000);
        
        // Check for valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Clear the timeout since we got a response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (isMounted) {
          // Always mark initialization as complete
          dispatch({ type: actionTypes.SET_SESSION_CHECK_COMPLETE, payload: true });
          dispatch({ type: actionTypes.SET_AUTH_INITIALIZED, payload: true });
          dispatch({ type: actionTypes.SET_AUTH_RESTORED, payload: true });
        }
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          // Clear any cached data and logout
          setStoredUserProfile(null);
          setStoredAuthState(null);
          if (isMounted) {
            dispatch({ type: actionTypes.LOGOUT });
          }
          return;
        }
        
        if (session?.user) {
          console.log('Valid session found for user:', session.user.email);
          
          // Update auth state timestamp
          setStoredAuthState({
            userId: session.user.id,
            email: session.user.email,
            timestamp: Date.now()
          });
          
          if (isMounted) {
            // Check if we have recent cached profile data
            const storedProfile = getStoredUserProfile();
            const storedAuthState = getStoredAuthState();
            const isRecentCache = storedAuthState && 
              (Date.now() - storedAuthState.timestamp) < (5 * 60 * 1000) &&
              storedAuthState.userId === session.user.id;
            
            if (isRecentCache && storedProfile) {
              console.log('Using cached profile for immediate display');
              dispatch({ type: actionTypes.SET_USER, payload: storedProfile });
              // Do not trigger an immediate background refresh here to avoid duplicate fetches.
              // The auth state listener will ensure freshness if needed.
            } else {
              console.log('Fetching fresh profile data');
              // Mark as handled to avoid duplicate fetch on subsequent auth event
              handledSignInForUserId = session.user.id;
              await fetchUserProfile(session.user.id, false);
            }
          }
        } else {
          console.log('No valid session found');
          // Clear any cached data
          setStoredUserProfile(null);
          setStoredAuthState(null);
          if (isMounted) {
            dispatch({ type: actionTypes.LOGOUT });
          }
        }
        
        // Initialize storage and policies in background (non-blocking)
        setTimeout(() => {
          Promise.all([
            createStorageBuckets().catch(error => 
              console.warn('Storage bucket setup failed:', error)
            ),
            setupStoragePolicies().catch(error => 
              console.warn('Storage policy setup failed:', error)
            ),
            setupDatabasePolicies().catch(error => {
              console.warn('Database policy setup failed:', error);
              printDatabasePolicyInstructions();
            })
          ]).catch(error => {
            console.warn('Background setup failed:', error);
          });
        }, 1000);
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (isMounted) {
          // Always complete initialization even on error
          dispatch({ type: actionTypes.SET_AUTH_RESTORED, payload: true });
          dispatch({ type: actionTypes.SET_SESSION_CHECK_COMPLETE, payload: true });
          dispatch({ type: actionTypes.SET_AUTH_INITIALIZED, payload: true });
          
          // Clear any potentially invalid cached data
          setStoredUserProfile(null);
          setStoredAuthState(null);
          dispatch({ type: actionTypes.LOGOUT });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - using a stable reference
    let authSubscription = null;
    
    const createAuthListener = () => {
      // Capture current state value to avoid stale closure
      const getCurrentUser = () => {
        return getStoredUserProfile();
      };
      
      return supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'no user', 'Email confirmed:', session?.user?.email_confirmed_at || 'n/a');
        
        if (!isMounted) return;
        
        if ((event === 'SIGNED_IN' && session?.user)) {
          console.log('User signed in, handling session...');
          await handleSessionAuth('SIGNED_IN', session);
        } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          console.log('User signed out or session ended, clearing all state');
          // Clear all stored data immediately
          setStoredUserProfile(null);
          setStoredAuthState(null);
          handledSignInForUserId = null; // Reset handled user on sign out
          // Clear app state
          dispatch({ type: actionTypes.LOGOUT });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed - minimal handling to prevent auto-refresh');
          // CRITICAL FIX: Minimal handling of token refresh to prevent auto-refresh cycles
          
          // Only update auth state timestamp - do not trigger any profile fetching
          const newAuthState = {
            userId: session.user.id,
            email: session.user.email,
            timestamp: Date.now()
          };
          setStoredAuthState(newAuthState);
          
          // IMPORTANT: Do not fetch profile data on token refresh
          // This prevents the auto-refresh behavior when returning to tabs
          // The existing user profile and data should remain valid
          console.log('Token refresh handled without triggering data refresh');
          
          // Only fetch profile if we somehow lost the current user (avoid stale closure)
          const currentCachedUser = getCurrentUser();
          if (!currentCachedUser) {
            console.warn('Missing cached user during token refresh - fetching fresh profile');
            await fetchUserProfile(session.user.id, false);
          } else {
            console.log('Current user still cached, skipping profile fetch on token refresh');
          }
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('Initial session present, handling without duplication');
          await handleSessionAuth('INITIAL_SESSION', session);
        } else if (event === 'INITIAL_SESSION' && !session) {
          console.log('Initial session check - no session found');
          // Only clear state if we have stale cached data
          const storedProfile = getStoredUserProfile();
          const storedAuthState = getStoredAuthState();
          if (storedProfile || storedAuthState) {
            console.log('Clearing stale cached data');
            setStoredUserProfile(null);
            setStoredAuthState(null);
            dispatch({ type: actionTypes.LOGOUT });
          }
        }
      });
    };
    
    // Create the auth listener
    const authListenerResult = createAuthListener();
    authSubscription = authListenerResult.data.subscription;

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - this effect should only run once

  // Fetch user profile from database
  const fetchUserProfile = async (userId, forceRefresh = false) => {
    try {
      console.log('Fetching user profile for ID:', userId, forceRefresh ? '(forced refresh)' : '');
      
      // If not forcing refresh and we have a valid cached profile, use it
      if (!forceRefresh) {
        const storedProfile = getStoredUserProfile();
        const storedAuthState = getStoredAuthState();
        
        if (storedProfile && storedAuthState && storedAuthState.userId === userId) {
          // Check if cached data is recent (less than 5 minutes old)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          if (storedAuthState.timestamp > fiveMinutesAgo) {
            console.log('Using recent cached profile');
            dispatch({ type: actionTypes.SET_USER, payload: storedProfile });
            
            // Still fetch user data in background
            fetchUserData(userId).catch(error => {
              console.error('Background user data fetch failed:', error);
            });
            return;
          }
        }
      }
      
      // Set profile loading state only if we don't have cached data
      if (!state.currentUser || forceRefresh) {
        dispatch({ type: actionTypes.SET_PROFILE_LOADING, payload: true });
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // If profile doesn't exist or there's a database error, create a fallback profile
        const fallbackProfile = await createFallbackProfile(userId);
        if (fallbackProfile) {
          dispatch({ type: actionTypes.SET_USER, payload: fallbackProfile });
          // Still try to fetch user data for fallback profiles, but don't block on errors
          fetchUserData(userId).catch(error => {
            console.error('User data fetch failed for fallback profile:', error);
          });
        }
        return;
      }

      if (profile) {
        console.log('Profile fetched successfully:', profile);
        const userProfile = {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email || '',
          phoneNumber: profile.phone_number,
          vehiclePlate: profile.vehicle_plate || profile.plate_number,
          badgeId: profile.badge_id,
          department: profile.department,
          userType: profile.role,
          lastUpdated: Date.now() // Add timestamp for cache validation
        };
        dispatch({ type: actionTypes.SET_USER, payload: userProfile });
        
        // Fetch user data in background
        fetchUserData(userId).catch(error => {
          console.error('User data fetch failed:', error);
        });
      } else {
        console.log('No profile found, creating fallback');
        const fallbackProfile = await createFallbackProfile(userId);
        if (fallbackProfile) {
          dispatch({ type: actionTypes.SET_USER, payload: fallbackProfile });
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Only try fallback if we don't have any cached profile
      if (!state.currentUser) {
        const fallbackProfile = await createFallbackProfile(userId);
        if (fallbackProfile) {
          dispatch({ type: actionTypes.SET_USER, payload: fallbackProfile });
        }
      }
    } finally {
      dispatch({ type: actionTypes.SET_PROFILE_LOADING, payload: false });
    }
  };

  // Create fallback profile from auth user metadata
  const createFallbackProfile = async (userId) => {
    try {
      console.log('Creating fallback profile for user:', userId);
      
      // First check if we have an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No active session, cannot create fallback profile');
        return null;
      }
      
      // Get current user from auth only if we have a session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Error getting auth user:', authError);
        return null;
      }
      
      // Create profile from auth user metadata
      const userMetadata = user.user_metadata || {};
      const fallbackProfile = {
        id: user.id,
        fullName: userMetadata.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phoneNumber: userMetadata.phone_number || '',
        vehiclePlate: userMetadata.vehicle_plate || userMetadata.plate_number || '',
        badgeId: userMetadata.badge_id || '',
        department: userMetadata.department || '',
        userType: userMetadata.role || 'user'
      };
      
      console.log('Fallback profile created:', fallbackProfile);
      return fallbackProfile;
    } catch (error) {
      console.error('Error creating fallback profile:', error);
      return null;
    }
  };

  // Fetch user-specific data (complaints and documents)
  const fetchUserData = async (userId) => {
    if (!userId) {
      console.warn('No userId provided to fetchUserData');
      return;
    }
    
    console.log('Fetching user data for:', userId);
    
    try {
      // Fetch complaints and documents in parallel with better error handling
      const results = await Promise.allSettled([
        fetchComplaints(),
        fetchDocuments(userId)
      ]);
      
      // Log results for debugging
      results.forEach((result, index) => {
        const operation = index === 0 ? 'complaints' : 'documents';
        if (result.status === 'rejected') {
          console.error(`Error fetching ${operation}:`, result.reason);
        } else {
          console.log(`Successfully fetched ${operation}`);
        }
      });
      
      // Even if some operations failed, don't throw - authentication should succeed
      console.log('User data fetch completed (some operations may have failed)');
    } catch (error) {
      console.error('Unexpected error in fetchUserData:', error);
      // Don't block authentication even if data fetching fails completely
    }
  };

  // Authentication functions
  const login = async (email, password) => {
    try {
      dispatch({ type: actionTypes.SET_AUTH_LOADING, payload: true });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Check if error is due to email not being confirmed
        if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            message: 'Please verify your email address before signing in. Check your inbox for a verification link.',
            needsVerification: true,
            email: email
          };
        }
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          return { 
            success: false, 
            message: 'Please verify your email address before signing in. Check your inbox for a verification link.',
            needsVerification: true,
            email: data.user.email
          };
        }
        
        // Fetch user profile and wait for it to complete
        await fetchUserProfile(data.user.id);
        return { success: true, user: data.user, needsRedirect: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    } finally {
      dispatch({ type: actionTypes.SET_AUTH_LOADING, payload: false });
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      
      // Clear localStorage immediately
      setStoredUserProfile(null);
      setStoredAuthState(null);
      
      // Clear app state immediately
      dispatch({ type: actionTypes.LOGOUT });
      
      // Sign out from Supabase in the background
      await supabase.auth.signOut().catch(error => {
        console.error('Supabase signOut error:', error);
        // Don't block logout even if Supabase signOut fails
      });
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure we still clear local state even if there's an error
      setStoredUserProfile(null);
      setStoredAuthState(null);
      dispatch({ type: actionTypes.LOGOUT });
      return { success: false, message: 'An error occurred during logout, but you have been logged out locally' };
    }
  };

  // Check for existing users with same email, phone, or vehicle plate
  const checkUserUniqueness = async (email, phoneNumber, vehiclePlate) => {
    try {
      // Check email uniqueness in auth.users table
      const { data: existingUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && existingUsers.users) {
        const emailExists = existingUsers.users.some(user => user.email === email);
        if (emailExists) {
          return { unique: false, field: 'email', message: 'This email address is already registered.' };
        }
      }
      
      // Check phone number and vehicle plate uniqueness in profiles table
      
      // Check phone number
      const { data: phoneCheck, error: phoneError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phoneNumber)
        .limit(1);
      
      if (!phoneError && phoneCheck && phoneCheck.length > 0) {
        return { unique: false, field: 'phoneNumber', message: 'This phone number is already registered.' };
      }
      
      // Check vehicle plate (check both new and old column names for backward compatibility)
      const { data: plateCheck, error: plateError } = await supabase
        .from('profiles')
        .select('id')
        .or(`vehicle_plate.eq.${vehiclePlate},plate_number.eq.${vehiclePlate}`)
        .limit(1);
      
      if (!plateError && plateCheck && plateCheck.length > 0) {
        return { unique: false, field: 'vehiclePlate', message: 'This vehicle plate number is already registered.' };
      }
      
      return { unique: true };
    } catch (error) {
      console.error('Error checking uniqueness:', error);
      // If we can't check, allow registration to proceed
      return { unique: true };
    }
  };

  // Create user profile in profiles table
  const createUserProfile = async (userId, userData) => {
    try {
      console.log('Creating user profile in database for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userData.fullName,
          email: userData.email,
          phone_number: userData.phoneNumber,
          vehicle_plate: userData.vehiclePlate,
          badge_id: userData.badgeId || null,
          department: userData.department || null,
          role: userData.userType || USER_ROLES.USER
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return { success: false, error };
      }

      console.log('Profile created successfully:', data);
      return { success: true, profile: data };
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return { success: false, error };
    }
  };

  const registerUser = async (userData) => {
    try {
      dispatch({ type: actionTypes.SET_AUTH_LOADING, payload: true });
      
      // Check uniqueness first
      const uniquenessCheck = await checkUserUniqueness(
        userData.email, 
        userData.phoneNumber, 
        userData.vehiclePlate
      );
      
      if (!uniquenessCheck.unique) {
        return { 
          success: false, 
          message: uniquenessCheck.message,
          field: uniquenessCheck.field 
        };
      }
      
      // Sign up user with Supabase Auth - enable email verification
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-verified`, // Redirect to neutral success page
          data: {
            full_name: userData.fullName,
            role: userData.userType || USER_ROLES.USER,
            phone_number: userData.phoneNumber,
            vehicle_plate: userData.vehiclePlate,
            badge_id: userData.badgeId,
            department: userData.department
          }
        }
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Create profile in profiles table (don't wait for it to complete)
        createUserProfile(data.user.id, userData).catch(error => {
          console.error('Profile creation failed, but auth user created:', error);
        });
        
        // With email verification enabled, user needs to verify email before logging in
        return { 
          success: true, 
          message: 'Registration successful! Please check your email to verify your account.',
          user: data.user,
          loggedIn: false,
          needsVerification: true,
          email: userData.email
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    } finally {
      dispatch({ type: actionTypes.SET_AUTH_LOADING, payload: false });
    }
  };

  // Complaint management functions
  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching complaints:', error);
        return;
      }

      // Transform data to match frontend format
      const transformedComplaints = data.map(complaint => ({
        id: complaint.id,
        title: complaint.title,
        description: complaint.description,
        location: complaint.location,
        category: complaint.category,
        offenderPlate: complaint.offender_plate,
        reportedBy: complaint.reported_by,
        reportedByName: complaint.reporter_name,
        reportedByPlate: complaint.reporter_plate || complaint.reporter_badge,
        submittedBy: complaint.submitted_by,
        status: complaint.status,
        priority: complaint.priority,
        dateReported: complaint.created_at,
        image: complaint.image_url,
        adminComments: complaint.admin_comments || ''
      }));

      dispatch({ type: actionTypes.SET_COMPLAINTS, payload: transformedComplaints });
    } catch (error) {
      console.error('Error in fetchComplaints:', error);
    }
  };

  const addComplaint = async (complaintData) => {
    try {
      // Validate category restrictions for non-admin users
      if (state.currentUser?.userType !== USER_ROLES.ADMIN && isCategoryRestricted(complaintData.category)) {
        return { 
          success: false, 
          message: 'This category is restricted to law enforcement officials only' 
        };
      }
      
      let imageUrl = null;

      // Upload image if provided
      if (complaintData.image) {
        imageUrl = await uploadComplaintImage(complaintData.image);
      }

      // Insert complaint into database
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          title: complaintData.title,
          description: complaintData.description,
          location: complaintData.location,
          category: complaintData.category,
          offender_plate: complaintData.offenderPlate,
          priority: complaintData.priority || COMPLAINT_PRIORITY.LOW,
          submitted_by: state.currentUser?.userType === USER_ROLES.ADMIN ? 'admin' : 'user',
          reported_by: state.currentUser?.id,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding complaint:', error);
        return { success: false, message: error.message };
      }

      // Transform and add to state
      const newComplaint = {
        id: data.id,
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        offenderPlate: data.offender_plate,
        reportedBy: data.reported_by,
        reportedByName: state.currentUser?.fullName,
        reportedByPlate: state.currentUser?.vehiclePlate || state.currentUser?.badgeId,
        submittedBy: data.submitted_by,
        status: data.status,
        priority: data.priority,
        dateReported: data.created_at,
        image: data.image_url,
        adminComments: data.admin_comments || ''
      };

      dispatch({ type: actionTypes.ADD_COMPLAINT, payload: newComplaint });
      return { success: true, complaint: newComplaint };
    } catch (error) {
      console.error('Error in addComplaint:', error);
      return { success: false, message: 'An error occurred while submitting the complaint' };
    }
  };

  const updateComplaint = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          status: updates.status,
          admin_comments: updates.adminComments,
          resolution_notes: updates.resolutionNotes,
          resolved_at: updates.status === COMPLAINT_STATUS.RESOLVED ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating complaint:', error);
        return { success: false, message: error.message };
      }

      dispatch({ type: actionTypes.UPDATE_COMPLAINT, payload: { id, updates } });
      return { success: true };
    } catch (error) {
      console.error('Error in updateComplaint:', error);
      return { success: false, message: 'An error occurred while updating the complaint' };
    }
  };

  // Image upload function
  const uploadComplaintImage = async (imageFile) => {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${state.currentUser?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.COMPLAINT_IMAGES)
        .upload(filePath, imageFile);

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.COMPLAINT_IMAGES)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadComplaintImage:', error);
      return null;
    }
  };

  // Document management functions
  const fetchDocuments = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      // Transform data to match frontend format
      const transformedDocuments = data.map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        name: doc.document_type === 'license' ? "Driver's License" :
              doc.document_type === 'roadworthiness' ? 'Road Worthiness Certificate' :
              'Insurance Certificate',
        type: doc.document_type,
        fileName: doc.file_name,
        expiryDate: doc.expiry_date,
        uploadDate: doc.created_at?.split('T')[0],
        fileUrl: doc.file_url,
        status: doc.status || DOCUMENT_STATUS.APPROVED, // Default to approved for existing docs
        rejectionReason: doc.rejection_reason,
        reviewedAt: doc.reviewed_at,
        reviewedBy: doc.reviewed_by
      }));

      dispatch({ type: actionTypes.SET_DOCUMENTS, payload: transformedDocuments });
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
    }
  };

  const addDocument = async (documentData, isReplacement = false) => {
    try {
      let fileUrl = null;

      // Upload document file
      if (documentData.file) {
        try {
          fileUrl = await uploadDocumentFile(documentData.file, documentData.type);
        } catch (uploadError) {
          console.error('Document upload failed:', uploadError);
          return { 
            success: false, 
            message: uploadError.message || 'Error uploading document file'
          };
        }
        
        if (!fileUrl) {
          return { success: false, message: 'Failed to get file URL after upload' };
        }
      }

      // Check if we're replacing an existing document
      const existingDoc = state.documents.find(doc => 
        doc.userId === state.currentUser?.id && doc.type === documentData.type
      );

      if (existingDoc && isReplacement) {
        // Update existing document instead of creating new one
        const updateData = {
          file_name: documentData.fileName,
          file_url: fileUrl,
          expiry_date: documentData.expiryDate,
          status: DOCUMENT_STATUS.PENDING, // Reset to pending for review
          rejection_reason: null, // Clear rejection reason
          reviewed_at: null, // Clear review timestamp
          reviewed_by: null, // Clear reviewer
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('documents')
          .update(updateData)
          .eq('id', existingDoc.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating document:', error);
          return { success: false, message: `Database error: ${error.message}` };
        }

        const updatedDocument = {
          id: data.id,
          userId: data.user_id,
          name: documentData.name,
          type: data.document_type,
          fileName: data.file_name,
          expiryDate: data.expiry_date,
          uploadDate: data.created_at?.split('T')[0],
          fileUrl: data.file_url,
          status: data.status || DOCUMENT_STATUS.PENDING,
          rejectionReason: data.rejection_reason,
          reviewedAt: data.reviewed_at,
          reviewedBy: data.reviewed_by
        };

        // Update document in state
        dispatch({ 
          type: actionTypes.SET_DOCUMENTS, 
          payload: state.documents.map(doc => 
            doc.id === existingDoc.id ? updatedDocument : doc
          )
        });
        
        return { success: true, document: updatedDocument, isReplacement: true };
      } else {
        // Create new document
        const documentInsertData = {
          user_id: state.currentUser?.id,
          document_type: documentData.type,
          file_name: documentData.fileName,
          file_url: fileUrl,
          expiry_date: documentData.expiryDate
        };
        
        // Try to add status field, but handle gracefully if column doesn't exist
        try {
          documentInsertData.status = DOCUMENT_STATUS.PENDING;
        } catch (error) {
          console.log('Status column may not exist yet, proceeding without it');
        }

        const { data, error } = await supabase
          .from('documents')
          .insert(documentInsertData)
          .select()
          .single();

        if (error) {
          console.error('Error adding document to database:', error);
          return { success: false, message: `Database error: ${error.message}` };
        }

        const newDocument = {
          id: data.id,
          userId: data.user_id,
          name: documentData.name,
          type: data.document_type,
          fileName: data.file_name,
          expiryDate: data.expiry_date,
          uploadDate: data.created_at?.split('T')[0],
          fileUrl: data.file_url,
          status: data.status || DOCUMENT_STATUS.PENDING,
          rejectionReason: data.rejection_reason,
          reviewedAt: data.reviewed_at,
          reviewedBy: data.reviewed_by
        };

        dispatch({ type: actionTypes.ADD_DOCUMENT, payload: newDocument });
        return { success: true, document: newDocument, isReplacement: false };
      }
    } catch (error) {
      console.error('Error in addDocument:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred while uploading the document'
      };
    }
  };

  // Upload document file to Supabase Storage
  const uploadDocumentFile = async (file, documentType) => {
    try {
      console.log('Uploading document file:', {
        fileName: file.name,
        fileSize: file.size,
        documentType,
        userId: state.currentUser?.id
      });
      
      // Validate file before upload
      if (!file || !state.currentUser?.id) {
        console.error('Missing file or user ID for document upload');
        throw new Error('Missing file or user authentication');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `${state.currentUser.id}/${fileName}`;
      
      console.log('Uploading to path:', filePath);

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_DOCUMENTS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('row-level security policy')) {
          throw new Error('Storage permission error. Please contact support or try logging out and back in.');
        } else if (error.message?.includes('file size')) {
          throw new Error('File is too large. Please upload a file smaller than 50MB.');
        } else if (error.message?.includes('file type')) {
          throw new Error('File type not supported. Please upload PDF, JPG, or PNG files only.');
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }
      
      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.USER_DOCUMENTS)
        .getPublicUrl(filePath);
      
      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadDocumentFile:', error);
      // Re-throw the error with the specific message so addDocument can handle it
      throw error;
    }
  };

  // Helper functions for filtered data
  const getComplaintsByUser = (userId) => {
    return state.complaints.filter(complaint => complaint.reportedBy === userId);
  };

  const getComplaintsAgainstUser = (plateNumber) => {
    return state.complaints.filter(complaint => complaint.offenderPlate === plateNumber);
  };

  const getDocumentsByUser = (userId) => {
    return state.documents.filter(doc => doc.userId === userId);
  };

  // Admin document verification functions
  const fetchAllDocuments = async () => {
    try {
      console.log('Fetching all documents for admin view...');
      
      // First, get all documents
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        return { success: false, message: documentsError.message };
      }

      console.log(`Found ${documents?.length || 0} documents in database`);

      if (!documents || documents.length === 0) {
        return { success: true, documents: [] };
      }

      // Get all unique user IDs from documents
      const userIds = [...new Set(documents.map(doc => doc.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);
      
      // Fetch profiles for all users who have uploaded documents
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, vehicle_plate')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue with documents but no profile info
      }

      console.log(`Found ${profiles?.length || 0} matching profiles`);

      // Create a lookup map for profiles
      const profileMap = (profiles || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});

      // Transform data for admin view with manual join
      const transformedDocuments = documents.map(doc => {
        const userProfile = profileMap[doc.user_id];
        return {
          id: doc.id,
          userId: doc.user_id,
          userName: userProfile?.full_name || 'Unknown User',
          userPlate: userProfile?.vehicle_plate || 'N/A',
          name: doc.document_type === 'license' ? "Driver's License" :
                doc.document_type === 'roadworthiness' ? 'Road Worthiness Certificate' :
                'Insurance Certificate',
          type: doc.document_type,
          fileName: doc.file_name,
          expiryDate: doc.expiry_date,
          uploadDate: doc.created_at?.split('T')[0],
          fileUrl: doc.file_url,
          status: doc.status || DOCUMENT_STATUS.PENDING,
          rejectionReason: doc.rejection_reason,
          reviewedAt: doc.reviewed_at,
          reviewedBy: doc.reviewed_by
        };
      });

      console.log(`Transformed ${transformedDocuments.length} documents for admin view`);
      return { success: true, documents: transformedDocuments };
    } catch (error) {
      console.error('Error in fetchAllDocuments:', error);
      return { success: false, message: 'An error occurred while fetching documents' };
    }
  };

  const updateDocumentStatus = async (documentId, status, rejectionReason = null) => {
    try {
      const updateData = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: state.currentUser?.id
      };

      if (status === DOCUMENT_STATUS.REJECTED && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      } else if (status === DOCUMENT_STATUS.APPROVED) {
        updateData.rejection_reason = null; // Clear any previous rejection reason
      }

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating document status:', error);
        return { success: false, message: error.message };
      }

      return { success: true, document: data };
    } catch (error) {
      console.error('Error in updateDocumentStatus:', error);
      return { success: false, message: 'An error occurred while updating document status' };
    }
  };

  // Password reset functions
  const requestPasswordReset = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Password reset link has been sent to your email' };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'An error occurred while requesting password reset' };
    }
  };

  const resetPassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'An error occurred while resetting password' };
    }
  };

  // Function to manually refresh user profile
  const refreshUserProfile = async () => {
    if (state.currentUser?.id) {
      await fetchUserProfile(state.currentUser.id, true);
    }
  };

  // Toast notification functions
  let toastId = 0;
  const addToast = (message, type = 'success', duration = 4000) => {
    const id = ++toastId;
    const toast = { id, message, type, duration, timestamp: Date.now() };
    dispatch({ type: actionTypes.ADD_TOAST, payload: toast });
    
    // Auto remove after duration
    setTimeout(() => {
      dispatch({ type: actionTypes.REMOVE_TOAST, payload: id });
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    dispatch({ type: actionTypes.REMOVE_TOAST, payload: id });
  };

  const showSuccess = (message, duration = 4000) => {
    return addToast(message, 'success', duration);
  };

  const showError = (message, duration = 6000) => {
    return addToast(message, 'error', duration);
  };

  const showWarning = (message, duration = 5000) => {
    return addToast(message, 'warning', duration);
  };

  const showInfo = (message, duration = 4000) => {
    return addToast(message, 'info', duration);
  };

  const value = {
    state,
    login,
    logout,
    registerUser,
    requestPasswordReset,
    resetPassword,
    addComplaint,
    updateComplaint,
    addDocument,
    fetchComplaints,
    fetchDocuments,
    fetchAllDocuments,
    updateDocumentStatus,
    refreshUserProfile,
    getComplaintsByUser,
    getComplaintsAgainstUser,
    getDocumentsByUser,
    // Toast functions
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
