# XtremePush Expo Plugin

A config plugin for Expo applications that integrates XtremePush SDK functionality with full React Native module support for both iOS and Android platforms.

## Table of Contents

- [Requirements](#requirements)
- [Platform Support](#platform-support)
- [Installation](#installation)
- [Platform Setup](#platform-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [License](#license)

## Requirements

### System Requirements
- **Node.js**: 18.0 or higher
- **Expo SDK**: 53.0 or higher
- **React Native**: 0.73.0 or higher

### iOS Requirements
- **iOS Deployment Target**: 13.0 or higher
- **Xcode**: 14.0 or higher
- **CocoaPods**: Latest version
- **Apple Developer Account** with Push Notification capability enabled

### Android Requirements
- **Minimum SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Gradle**: 8.0 or higher
- **Google Play Services**: Required for FCM

## Platform Support

| Platform | Minimum Version | Push Notifications | In-App Messages | Location Services |
|----------|----------------|-------------------|-----------------|-------------------|
| iOS      | 13.0+          | ✅                | ✅              | ✅                |
| Android  | 5.0+ (API 21)  | ✅                | ✅              | ✅                |

## Installation

### Step 1: Install the Plugin

```bash
# Using npm
npm install xtremepush-expo-plugin

# Using yarn
yarn add xtremepush-expo-plugin
```

### Step 2: Configure Your App

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "name": "YourAppName",
    "plugins": [
      [
        "xtremepush-expo-plugin",
        {
          "applicationKey": "YOUR_XTREMEPUSH_APP_KEY",
          "iosAppKey": "YOUR_IOS_APP_KEY",
          "androidAppKey": "YOUR_ANDROID_APP_KEY",
          "googleSenderId": "YOUR_FCM_SENDER_ID",
          "enableDebugLogs": true,
          "enableLocationServices": true,
          "enablePushPermissions": true
        }
      ]
    ]
  }
}
```

### Step 3: Prebuild Your Project

After adding the plugin configuration, rebuild your native projects:

```bash
# Clean rebuild (recommended for first-time setup)
npx expo prebuild --clean

# For iOS, install CocoaPods dependencies
cd ios && pod install && cd ..
```

### Step 4: Run Your Application

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## Platform Setup


#### 1. Capabilities

The plugin automatically configures these capabilities in your iOS project:
- Push Notifications
- Background Modes (Remote notifications)
- App Groups (if required)

#### 2. Permissions

The plugin automatically adds required permissions to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<!-- Added if location services enabled -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

## Configuration

### Advanced Configuration

```javascript
// app.config.js
export default {
  expo: {
    plugins: [
      [
        "xtremepush-expo-plugin",
        {
          // Required
          "applicationKey": "YOUR_APP_KEY",
          "googleSenderId": "YOUR_FCM_SENDER_ID",
          
          // Platform-specific keys (optional)
          "iosAppKey": "IOS_SPECIFIC_KEY",
          "androidAppKey": "ANDROID_SPECIFIC_KEY",
          
          // Server configuration (optional)
          "serverUrl": "https://sdk.us.xtremepush.com",
          "useUsServer": false,
          
          // Features (optional)
          "enableDebugLogs": true,
          "enableLocationServices": false,
          "enablePushPermissions": true,
          "enableCrashReporting": false,
          
          // iOS specific (optional)
          "iosPermissions": {
            "NSLocationWhenInUseUsageDescription": "We need your location to provide relevant offers",
            "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to send location-based notifications"
          },
          
          // Android specific (optional)
          "androidIcon": "ic_notification",
          "androidIconColor": "#FF0000"
        }
      ]
    ]
  }
};
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `applicationKey` | string | Yes | - | Your XtremePush application key |
| `googleSenderId` | string | Yes* | - | FCM Sender ID (*Required for Android) |
| `iosAppKey` | string | No | `applicationKey` | iOS-specific application key |
| `androidAppKey` | string | No | `applicationKey` | Android-specific application key |
| `serverUrl` | string | No | Default XP server | Custom server URL |
| `useUsServer` | boolean | No | false | Use US data center |
| `enableDebugLogs` | boolean | No | false | Enable SDK debug logging |
| `enableLocationServices` | boolean | No | false | Enable location tracking |
| `enablePushPermissions` | boolean | No | true | Auto-request push permissions |
| `enableCrashReporting` | boolean | No | false | Enable crash reporting |
| `androidIcon` | string | No | - | Android notification icon resource |
| `androidIconColor` | string | No | - | Android notification icon color (hex) |

## Usage

### Import the Module

```javascript
// Import default export
import Xtremepush from './xtremepush';

// Or import specific functions
import { 
  hitEvent, 
  hitTag, 
  setUser, 
  openInbox,
  requestNotificationPermissions 
} from './xtremepush';
```

### Basic Integration

```javascript
import { useEffect } from 'react';
import Xtremepush from './xtremepush';

export default function App() {
  useEffect(() => {
    // Set user identifier
    Xtremepush.setUser('user@example.com');
    
    // Track app open event
    Xtremepush.hitEvent('app_opened');
    
    // Request push permissions (iOS only)
    Xtremepush.requestNotificationPermissions();
  }, []);
  
  return <YourApp />;
}
```

### User Management

```javascript
// Set user ID (email, username, or unique ID)
Xtremepush.setUser("user@example.com");

// Set external ID (e.g., your CRM ID)
Xtremepush.setExternalId("CRM-12345");
```

### Event Tracking

```javascript
// Track simple events
Xtremepush.hitEvent("purchase_completed");
Xtremepush.hitEvent("article_read");
Xtremepush.hitEvent("level_completed");

// Track tags (user properties)
Xtremepush.hitTag("premium_user");
Xtremepush.hitTag("newsletter_subscriber");

// Track tags with values
Xtremepush.hitTagWithValue("user_level", "gold");
Xtremepush.hitTagWithValue("purchase_amount", "99.99");
Xtremepush.hitTagWithValue("cart_items", "3");
```

### Push Notifications

```javascript
// Request notification permissions
Xtremepush.requestNotificationPermissions();

// Open message inbox
Xtremepush.openInbox();
```

#### iOS Common Issues
- **Wrong Environment**: Ensure using Development cert for testing, Production for App Store
- **Expired Certificates**: Certificates are valid for 1 year, renew before expiration
- **Bundle ID Mismatch**: Certificate must match app's Bundle ID exactly


#### Android Common Issues
- **Invalid Server Key**: Ensure using Server Key, not Web API Key
- **Package Name Mismatch**: Firebase package name must match your app exactly
- **Missing google-services.json**: File must be in project root




## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 XtremePush
