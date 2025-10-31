# User Name Functionality Design Document

## Overview

This design outlines the implementation of user name functionality in the NinjaDo application. The solution will extend the existing signup flow to collect user names, store them in the existing profiles table, and provide name management in the profile page.

## Architecture

### Current State Analysis

The application currently has:
- Supabase Auth UI for login/signup in `src/pages/Login.tsx`
- Profile page with email and password management in `src/pages/Profile.tsx`
- Existing `public.profiles` table with `username` column (nullable)
- Profile creation may or may not happen automatically on signup

### Target State

After implementation:
- Enhanced signup flow that collects user names
- Profile page displays and allows editing of user names
- Automatic profile creation with username on signup
- Graceful handling of existing users without names

## Components and Interfaces

### 1. Enhanced Signup Flow

#### Current Implementation
- Uses Supabase Auth UI component
- Handles email/password authentication only
- No custom fields or profile creation

#### Enhanced Implementation
- Custom signup form to collect name along with email/password
- Automatic profile creation after successful signup
- Fallback to existing Auth UI for login

#### Technical Approach
- Create custom signup component alongside existing Auth UI
- Use Supabase auth.signUp() with email/password
- Listen for auth state changes to create profile
- Handle profile creation in useEffect after successful signup

### 2. Profile Management

#### Current Implementation
- Shows email (read-only)
- Allows password changes
- No name display or editing

#### Enhanced Implementation
- Fetch and display username from profiles table
- Editable name field with save functionality
- Loading states and error handling
- Success/error notifications

#### Technical Approach
- Add React Query for profile data fetching
- Create name editing form with validation
- Use Supabase client for profile updates
- Integrate with existing profile page layout

### 3. Database Integration

#### Profiles Table Structure (Existing)
```sql
public.profiles {
  id: string (UUID, references auth.users.id)
  username: string | null
  avatar_url: string | null
  updated_at: string
}
```

#### Profile Creation Strategy
- Create profile record on signup completion
- Use auth user ID as profile ID
- Set username from signup form
- Handle existing users gracefully

## Data Models

### Profile Interface
```typescript
interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string;
}
```

### Signup Form Data
```typescript
interface SignupFormData {
  email: string;
  password: string;
  name: string;
}
```

## Error Handling

### Signup Flow Error Handling
1. **Validation Errors**: Client-side validation for name, email, password
2. **Auth Errors**: Handle Supabase auth errors (email exists, weak password, etc.)
3. **Profile Creation Errors**: Handle database errors when creating profile
4. **Network Errors**: Handle connection issues gracefully

### Profile Update Error Handling
1. **Validation Errors**: Name length and character validation
2. **Database Errors**: Handle Supabase update failures
3. **Permission Errors**: Handle unauthorized access attempts
4. **Network Errors**: Retry mechanisms and user feedback

## Testing Strategy

### Signup Flow Testing
1. **New User Signup**: Test complete flow with name collection
2. **Existing User Login**: Ensure existing login flow still works
3. **Profile Creation**: Verify profile is created with correct data
4. **Error Scenarios**: Test various failure modes

### Profile Management Testing
1. **Name Display**: Test fetching and displaying existing names
2. **Name Editing**: Test updating names successfully
3. **Empty Names**: Test handling users without names
4. **Validation**: Test name validation rules

### Integration Testing
1. **End-to-End Flow**: Signup → Login → Profile management
2. **Existing Users**: Test with users who don't have profiles
3. **Data Consistency**: Verify profile data matches auth data

## Implementation Approach

### Phase 1: Custom Signup Component
1. Create custom signup form component
2. Implement name collection alongside email/password
3. Handle signup with Supabase auth.signUp()
4. Add profile creation after successful signup

### Phase 2: Profile Integration
1. Add profile fetching to Profile page
2. Implement name display and editing
3. Add validation and error handling
4. Integrate with existing profile page design

### Phase 3: Enhanced User Experience
1. Add loading states and animations
2. Implement proper error messages
3. Add success notifications
4. Handle edge cases and existing users

### Phase 4: Testing and Validation
1. Comprehensive testing of all flows
2. Validation with existing user accounts
3. Performance testing and optimization
4. User experience validation

## User Experience Design

### Signup Flow UX
- Clean, simple form with name, email, password fields
- Clear validation messages
- Consistent with existing NinjaDo design language
- Smooth transition to main application after signup

### Profile Page UX
- Name field integrated naturally with existing profile layout
- Inline editing with save/cancel options
- Clear feedback for successful updates
- Graceful handling of missing names

## Security Considerations

### Data Validation
- Client-side validation for user experience
- Server-side validation through Supabase RLS policies
- Sanitization of name input to prevent XSS

### Access Control
- Users can only view/edit their own profiles
- Proper authentication checks before profile operations
- RLS policies ensure data isolation

## Performance Considerations

### Efficient Data Fetching
- Use React Query for caching profile data
- Minimize database queries
- Implement proper loading states

### Optimistic Updates
- Update UI immediately for better UX
- Rollback on errors
- Show loading indicators for network operations

## Migration Strategy

### Existing Users
- Existing users without profiles: Create profile on first login
- Existing users with profiles but no username: Allow adding name
- No breaking changes to existing functionality

### Database Considerations
- Username column already exists and is nullable
- No schema changes required
- Existing data remains intact