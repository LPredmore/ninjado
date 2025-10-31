# Implementation Plan

- [ ] 1. Establish baseline and prepare for cleanup
  - Document current bundle size and build status
  - Verify all existing functionality works correctly
  - Create git checkpoint before starting cleanup
  - _Requirements: 3.1, 3.3_

- [ ] 2. Remove simple HTML wrapper components
  - [ ] 2.1 Remove breadcrumb component system
    - Delete `src/components/ui/breadcrumb.tsx`
    - Verify no imports reference breadcrumb components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 2.2 Remove table component system
    - Delete `src/components/ui/table.tsx`
    - Verify no imports reference table components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 2.3 Remove pagination component system
    - Delete `src/components/ui/pagination.tsx`
    - Verify no imports reference pagination components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 3. Remove Radix UI wrapper components
  - [ ] 3.1 Remove aspect-ratio component system
    - Delete `src/components/ui/aspect-ratio.tsx`
    - Verify no imports reference aspect-ratio components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.2 Remove hover-card component system
    - Delete `src/components/ui/hover-card.tsx`
    - Verify no imports reference hover-card components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.3 Remove context-menu component system
    - Delete `src/components/ui/context-menu.tsx`
    - Verify no imports reference context-menu components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.4 Remove navigation-menu component system
    - Delete `src/components/ui/navigation-menu.tsx`
    - Verify no imports reference navigation-menu components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.5 Remove menubar component system
    - Delete `src/components/ui/menubar.tsx`
    - Verify no imports reference menubar components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 4. Remove external package wrapper components
  - [ ] 4.1 Remove input-otp component system
    - Delete `src/components/ui/input-otp.tsx`
    - Verify no imports reference input-otp components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 4.2 Remove drawer component system
    - Delete `src/components/ui/drawer.tsx`
    - Verify no imports reference drawer components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 4.3 Remove command component system
    - Delete `src/components/ui/command.tsx`
    - Verify no imports reference command components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 4.4 Remove chart component system
    - Delete `src/components/ui/chart.tsx`
    - Verify no imports reference chart components
    - Run build to confirm no errors
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 5. Clean up package.json dependencies
  - [ ] 5.1 Remove unused Radix UI dependencies
    - Remove `@radix-ui/react-menubar` from package.json
    - Remove `@radix-ui/react-navigation-menu` from package.json
    - Remove `@radix-ui/react-context-menu` from package.json
    - Remove `@radix-ui/react-hover-card` from package.json
    - Remove `@radix-ui/react-aspect-ratio` from package.json
    - _Requirements: 1.3, 1.4_

  - [ ] 5.2 Remove unused external package dependencies
    - Remove `vaul` from package.json
    - Remove `cmdk` from package.json
    - Remove `input-otp` from package.json
    - Keep `recharts` for potential future use
    - _Requirements: 1.3, 1.4_

  - [ ] 5.3 Update package-lock.json
    - Run `npm install` to update package-lock.json
    - Verify all remaining dependencies are properly locked
    - _Requirements: 1.3, 1.4_

- [ ] 6. Final validation and testing
  - [ ] 6.1 Comprehensive build validation
    - Run full build process to ensure no errors
    - Verify TypeScript compilation succeeds
    - Check for any ESLint warnings or errors
    - _Requirements: 3.1, 3.3_

  - [ ] 6.2 Bundle size analysis
    - Measure final bundle size after cleanup
    - Compare with baseline measurements
    - Document size reduction achieved
    - _Requirements: 3.2_

  - [ ] 6.3 Functionality verification
    - Test user authentication flow
    - Test routine creation and management
    - Test task execution workflow
    - Test rewards system functionality
    - Test reports and analytics
    - Test profile management
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4_