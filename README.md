# ARoundNUS

## Project Idea

ARoundNUS is an innovative augmented reality (AR) application designed to enhance the navigation and exploration experience at the National University of Singapore (NUS). The app aims to help students, staff, and visitors discover and interact with various locations and points of interest across the campus in an engaging and intuitive way.

## Features

- **AR Navigation**: Real-time directional guidance using augmented reality
- **Points of Interest**: Discover and learn about key locations on campus
- **Interactive Map**: 2D map view with searchable locations
- **Information Hub**: Detailed information about buildings, facilities, and services
- **User Authentication**: Sign in with email/password, Google, or Apple accounts
- **Social Interactivity and Sharability**: Ability to share routes and location info with other app users

## Technologies Used

### Frontend

- **React Native**: Cross-platform mobile development framework
  - _Justification_: Enables development for both iOS and Android with a single codebase
- **Expo**: Development framework and platform for React Native
  - _Justification_: Simplifies development process and provides essential tools and services
- **React Navigation**: Navigation library for React Native applications
  - _Justification_: Provides a seamless navigation experience between screens

### Authentication

- **Firebase Authentication**: User authentication service
  - _Justification_: Secure and easy-to-implement authentication with multiple sign-in methods
- **Google Sign-In**: OAuth-based authentication for Google accounts
  - _Justification_: Provides a familiar and secure sign-in option for users

### AR Technology

- **Unity**:
  - _Justification_: Industry standard with a wide range of libraries that integrate seamlessly with Android's ARCore and iOS' ARKit SDKs and the ability to embed Unity projects within React Native applications
- **Immersal SDK**
  - _Justification_: Granular control over mapping process while still being able to simply use any LiDAR-enabled smartphone, good localization speeds and accuracies, and the ability to stitch maps together thereby simplifying scalability of future extensions greatly

### Backend

- **Firebase**: Backend-as-a-Service platform
  - _Justification_: Provides authentication, database, and storage services in one platform
- **Firestore**: NoSQL cloud database
  - _Justification_: Flexible, scalable database for storing application data

## Development Plan

_To be updated_

## User Guide

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app installed on your mobile device

### Setup and Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/aroundnus.git
   cd aroundnus
   ```

### Procedure

1. Install dependencies

   ```bash
   cd frontend/
   npm install
   ```

2. Start the app

   ```bash
   npm run web
   ```

3. Open the Expo Go app on your mobile device and scan the QR code displayed in the terminal.

## Acknowledgements

Made by Clement Aditya Chendra and Dylan Ananda Astono as part of the 2025 Orbital program by the School of Computing at the National University of Singapore.
