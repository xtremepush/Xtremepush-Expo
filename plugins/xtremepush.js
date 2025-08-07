import { NativeModules, Platform } from 'react-native';

const Xtremepush = NativeModules.Xtremepush;

// Debug logging
if (!Xtremepush) {
    console.warn('XtremePush: Native module not found. Please ensure:');
    console.warn('- The plugin is properly installed');
    console.warn('- You have run "npx expo prebuild --clean"');
    console.warn('- For iOS: pod install has been run');
    console.warn('- The app has been rebuilt');
    console.warn('Platform:', Platform.OS);
    console.warn('Available modules:', Object.keys(NativeModules));
}

export default Xtremepush || {};

export function hitEvent(event) {
    if (Xtremepush?.hitEvent) {
        Xtremepush.hitEvent(event);
    } else {
        console.warn('XtremePush: hitEvent not available');
    }
}

export function hitTag(tag) {
    if (Xtremepush?.hitTag) {
        Xtremepush.hitTag(tag);
    } else {
        console.warn('XtremePush: hitTag not available');
    }
}

export function hitTagWithValue(tag, value) {
    if (Xtremepush?.hitTagWithValue) {
        Xtremepush.hitTagWithValue(tag, value);
    } else {
        console.warn('XtremePush: hitTagWithValue not available');
    }
}

export function openInbox() {
    if (Xtremepush?.openInbox) {
        Xtremepush.openInbox();
    } else {
        console.warn('XtremePush: openInbox not available');
    }
}

export function setUser(user) {
    if (Xtremepush?.setUser) {
        Xtremepush.setUser(user);
    } else {
        console.warn('XtremePush: setUser not available');
    }
}

export function setExternalId(id) {
    if (Xtremepush?.setExternalId) {
        Xtremepush.setExternalId(id);
    } else {
        console.warn('XtremePush: setExternalId not available');
    }
}

export function requestNotificationPermissions() {
    if (Xtremepush?.requestNotificationPermissions) {
        Xtremepush.requestNotificationPermissions();
    } else {
        console.warn('XtremePush: requestNotificationPermissions not available');
    }
}

// Export a method to check if the module is available
export function isAvailable() {
    return !!Xtremepush;
}

// Export constants if available
export const constants = Xtremepush?.getConstants?.() || {};

// Debug methods for troubleshooting push notifications
export function checkPushNotificationStatus() {
    return new Promise((resolve, reject) => {
        // Always resolve with basic info since native methods removed to prevent crashes
        resolve({
            message: 'Push status check disabled for stability',
            authorizationStatus: 'unknown',
            note: 'Debug methods disabled to prevent app crashes'
        });
    });
}

export function getCurrentDeviceToken() {
    return new Promise((resolve, reject) => {
        // Always resolve with basic info since native methods removed to prevent crashes
        resolve({
            message: 'Device token check disabled for stability',
            note: 'Debug methods disabled to prevent app crashes'
        });
    });
}

