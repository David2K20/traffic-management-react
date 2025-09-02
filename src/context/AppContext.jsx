import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase, USER_ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY, STORAGE_BUCKETS } from '../lib/supabase';
import { createStorageBuckets } from '../utils/createStorageBuckets';

const AppContext = createContext();

// Initial state - now empty, will be populated from Supabase
const initialState = {
  currentUser: null,
  loading: true,
  complaints: [],
  documents: [],
  authLoading: false
};

// Action types
const actionTypes = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',
  SET_COMPLAINTS: 'SET_COMPLAINTS',
  ADD_COMPLAINT: 'ADD_COMPLAINT',
  UPDATE_COMPLAINT: 'UPDATE_COMPLAINT',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  LOGOUT: 'LOGOUT'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return {
        ...state,
        currentUser: action.payload,
        loading: false
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
    
    case actionTypes.LOGOUT:
      return {
        ...state,
        currentUser: null,
        complaints: [],
        documents: []
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
    const initializeAuth = async () => {
      try {
        // Initialize storage buckets first
        await createStorageBuckets();
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email, 'Email confirmed:', session?.user?.email_confirmed_at);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: actionTypes.LOGOUT });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Handle token refresh - user might have verified email
          await fetchUserProfile(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      
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
          // Skip fetchUserData for fallback profiles to avoid additional database errors
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
          userType: profile.role
        };
        dispatch({ type: actionTypes.SET_USER, payload: userProfile });
        await fetchUserData(userId);
      } else {
        console.log('No profile found, creating fallback');
        const fallbackProfile = await createFallbackProfile(userId);
        if (fallbackProfile) {
          dispatch({ type: actionTypes.SET_USER, payload: fallbackProfile });
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Create fallback profile on any error
      const fallbackProfile = await createFallbackProfile(userId);
      if (fallbackProfile) {
        dispatch({ type: actionTypes.SET_USER, payload: fallbackProfile });
      }
    }
  };

  // Create fallback profile from auth user metadata
  const createFallbackProfile = async (userId) => {
    try {
      console.log('Creating fallback profile for user:', userId);
      
      // Get current user from auth
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
    try {
      // Fetch complaints (non-blocking)
      try {
        await fetchComplaints();
      } catch (error) {
        console.error('Error fetching complaints:', error);
        // Don't block user login if complaints can't be fetched
      }
      
      // Fetch documents (non-blocking)
      try {
        await fetchDocuments(userId);
      } catch (error) {
        console.error('Error fetching documents:', error);
        // Don't block user login if documents can't be fetched
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Don't block authentication even if data fetching fails
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
      await supabase.auth.signOut();
      dispatch({ type: actionTypes.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
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
        fileUrl: doc.file_url
      }));

      dispatch({ type: actionTypes.SET_DOCUMENTS, payload: transformedDocuments });
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
    }
  };

  const addDocument = async (documentData) => {
    try {
      let fileUrl = null;

      // Upload document file
      if (documentData.file) {
        fileUrl = await uploadDocumentFile(documentData.file, documentData.type);
        if (!fileUrl) {
          return { success: false, message: 'Error uploading document file' };
        }
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: state.currentUser?.id,
          document_type: documentData.type,
          file_name: documentData.fileName,
          file_url: fileUrl,
          expiry_date: documentData.expiryDate
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding document:', error);
        return { success: false, message: error.message };
      }

      const newDocument = {
        id: data.id,
        userId: data.user_id,
        name: documentData.name,
        type: data.document_type,
        fileName: data.file_name,
        expiryDate: data.expiry_date,
        uploadDate: data.created_at?.split('T')[0],
        fileUrl: data.file_url
      };

      dispatch({ type: actionTypes.ADD_DOCUMENT, payload: newDocument });
      return { success: true, document: newDocument };
    } catch (error) {
      console.error('Error in addDocument:', error);
      return { success: false, message: 'An error occurred while uploading the document' };
    }
  };

  // Upload document file to Supabase Storage
  const uploadDocumentFile = async (file, documentType) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Math.random()}.${fileExt}`;
      const filePath = `${state.currentUser?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_DOCUMENTS)
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading document:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.USER_DOCUMENTS)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadDocumentFile:', error);
      return null;
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
    getComplaintsByUser,
    getComplaintsAgainstUser,
    getDocumentsByUser
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
