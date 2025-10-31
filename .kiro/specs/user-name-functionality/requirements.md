# User Name Functionality Requirements Document

## Introduction

This document outlines the requirements for implementing user name functionality in the NinjaDo application. The goal is to collect user names during signup, store them in the profiles table, and allow users to view and edit their names in the profile page.

## Glossary

- **NinjaDo Application**: The main React application for task and routine management
- **Profiles Table**: The public.profiles table in Supabase that stores user profile information
- **Username Column**: The username field in the public.profiles table for storing user names
- **Signup Flow**: The process where new users create an account
- **Profile Page**: The user profile management page where users can view and edit their information

## Requirements

### Requirement 1: Collect User Name During Signup

**User Story:** As a new user, I want to provide my name during signup so that the application can personalize my experience.

#### Acceptance Criteria

1. WHEN a user signs up for a new account, THE NinjaDo Application SHALL prompt them to enter their name
2. WHEN a user provides their name during signup, THE NinjaDo Application SHALL store it in the public.profiles.username column
3. WHEN a user completes signup with a name, THE NinjaDo Application SHALL create a profile record with their user ID and username
4. WHEN a user signs up without providing a name, THE NinjaDo Application SHALL still allow account creation with a null username
5. THE NinjaDo Application SHALL validate that names are reasonable length and contain appropriate characters

### Requirement 2: Display User Name in Profile Page

**User Story:** As a user, I want to see my name displayed in my profile so that I can verify my account information.

#### Acceptance Criteria

1. WHEN a user visits the profile page, THE NinjaDo Application SHALL fetch their username from public.profiles.username
2. WHEN a user has a username stored, THE NinjaDo Application SHALL display it in the profile page
3. WHEN a user does not have a username stored, THE NinjaDo Application SHALL show a placeholder or empty field
4. WHEN displaying the username, THE NinjaDo Application SHALL show it in an editable format
5. THE NinjaDo Application SHALL handle loading states while fetching profile data

### Requirement 3: Allow User Name Editing

**User Story:** As a user, I want to edit my name in my profile so that I can keep my information up to date.

#### Acceptance Criteria

1. WHEN a user wants to edit their name, THE NinjaDo Application SHALL provide an editable input field
2. WHEN a user updates their name, THE NinjaDo Application SHALL validate the new name
3. WHEN a user saves their updated name, THE NinjaDo Application SHALL update the public.profiles.username column
4. WHEN the name update is successful, THE NinjaDo Application SHALL show a success message
5. WHEN the name update fails, THE NinjaDo Application SHALL show an error message and allow retry

### Requirement 4: Maintain Existing Functionality

**User Story:** As a user, I want all existing features to continue working after name functionality is added so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN name functionality is added, THE NinjaDo Application SHALL preserve all existing login and signup functionality
2. WHEN name functionality is added, THE NinjaDo Application SHALL maintain all existing profile page features
3. WHEN name functionality is added, THE NinjaDo Application SHALL continue to work with existing user accounts
4. WHEN name functionality is added, THE NinjaDo Application SHALL handle users who don't have names stored gracefully