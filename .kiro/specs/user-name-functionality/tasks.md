# User Name Functionality Implementation Plan

- [ ] 1. Create custom signup component
  - [x] 1.1 Create SignupForm component


    - Create new component `src/components/SignupForm.tsx`
    - Implement form with name, email, and password fields
    - Add client-side validation for all fields
    - Style component to match existing NinjaDo design
    - _Requirements: 1.1, 1.5_


  - [ ] 1.2 Implement signup logic
    - Add signup handler using Supabase auth.signUp()
    - Handle authentication errors and display user-friendly messages
    - Add loading states during signup process
    - _Requirements: 1.1, 1.4_


  - [ ] 1.3 Add profile creation after signup
    - Listen for auth state changes after successful signup
    - Create profile record in public.profiles table with username
    - Handle profile creation errors gracefully
    - _Requirements: 1.2, 1.3_

- [x] 2. Update Login page to include custom signup


  - [ ] 2.1 Modify Login page layout
    - Add tab or toggle between login and signup modes
    - Integrate custom SignupForm component

    - Maintain existing Supabase Auth UI for login
    - Ensure responsive design on all screen sizes
    - _Requirements: 4.1_

  - [ ] 2.2 Handle signup completion
    - Redirect users to main application after successful signup
    - Show success message for completed signup
    - Handle edge cases and error scenarios
    - _Requirements: 1.1, 4.1_





- [ ] 3. Add profile data fetching to Profile page
  - [ ] 3.1 Implement profile data queries
    - Add React Query for fetching profile data from public.profiles
    - Create profile query key and fetch function
    - Handle loading and error states for profile data
    - _Requirements: 2.1, 2.5_

  - [ ] 3.2 Handle users without profiles
    - Create profile record for existing users who don't have one
    - Handle graceful fallback when profile doesn't exist

    - Ensure backward compatibility with existing users
    - _Requirements: 4.3, 4.4_

- [ ] 4. Implement name display and editing in Profile page
  - [x] 4.1 Add name display section

    - Add username field to profile page layout
    - Display current username or placeholder if empty
    - Integrate with existing profile page design
    - _Requirements: 2.2, 2.3, 2.4_


  - [ ] 4.2 Implement name editing functionality
    - Create editable input field for username

    - Add save and cancel buttons for name editing
    - Implement inline editing with proper UX
    - _Requirements: 3.1, 3.2_

  - [ ] 4.3 Add name update logic
    - Implement username update using Supabase client
    - Add validation for username (length, characters)
    - Handle update success and error scenarios
    - Show appropriate success/error messages
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 5. Testing and validation
  - [ ] 5.1 Test signup flow
    - Test new user signup with name collection
    - Verify profile creation with correct username
    - Test signup validation and error handling
    - Ensure existing login functionality still works
    - _Requirements: 1.1, 1.2, 1.3, 4.1_

  - [ ] 5.2 Test profile management
    - Test username display for users with and without names
    - Test username editing and updating functionality
    - Verify proper error handling and user feedback
    - Test with existing user accounts
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3, 4.2, 4.3, 4.4_

  - [ ] 5.3 Integration testing
    - Test complete flow: signup → login → profile management
    - Verify data consistency between auth and profiles tables
    - Test edge cases and error scenarios
    - Ensure all existing functionality remains intact
    - _Requirements: 4.1, 4.2, 4.3, 4.4_