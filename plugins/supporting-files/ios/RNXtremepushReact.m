#import "RNXtremepushReact.h"

// Try to import XPush - if this fails, the module won't load
#if __has_include(<XPush/XPush.h>)
#import <XPush/XPush.h>
#define XPUSH_AVAILABLE 1
#else
#define XPUSH_AVAILABLE 0
#endif

@implementation RNXtremepushReact

// Export the module name to JavaScript
RCT_EXPORT_MODULE(Xtremepush)

// Ensure module is initialized on main queue
+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

// Export constants to verify module is loaded
- (NSDictionary *)constantsToExport
{
    return @{
        @"isAvailable": @(XPUSH_AVAILABLE),
        @"moduleVersion": @"3.1.7",
        @"sdkAvailable": @(XPUSH_AVAILABLE)
    };
}

// MARK: - XtremePush Methods

RCT_EXPORT_METHOD(hitTag:(NSString *)tag)
{
#if XPUSH_AVAILABLE
    if (tag && tag.length > 0) {
        [XPush hitTag:tag];
        NSLog(@"XtremePush: hitTag called with: %@", tag);
    }
#else
    NSLog(@"XtremePush: hitTag called but SDK not available: %@", tag);
#endif
}

RCT_EXPORT_METHOD(hitTagWithValue:(NSString *)tag withValue:(NSString *)value)
{
#if XPUSH_AVAILABLE
    if (tag && tag.length > 0) {
        [XPush hitTag:tag withValue:value];
        NSLog(@"XtremePush: hitTagWithValue called with: %@, value: %@", tag, value);
    }
#else
    NSLog(@"XtremePush: hitTagWithValue called but SDK not available: %@, %@", tag, value);
#endif
}

RCT_EXPORT_METHOD(hitEvent:(NSString *)event)
{
#if XPUSH_AVAILABLE
    if (event && event.length > 0) {
        [XPush hitEvent:event];
        NSLog(@"XtremePush: hitEvent called with: %@", event);
    }
#else
    NSLog(@"XtremePush: hitEvent called but SDK not available: %@", event);
#endif
}

RCT_EXPORT_METHOD(openInbox)
{
#if XPUSH_AVAILABLE
    dispatch_async(dispatch_get_main_queue(), ^{
        [XPush openInbox];
    });
    NSLog(@"XtremePush: openInbox called");
#else
    NSLog(@"XtremePush: openInbox called but SDK not available");
#endif
}

RCT_EXPORT_METHOD(setUser:(NSString *)user)
{
#if XPUSH_AVAILABLE
    if (user && user.length > 0) {
        [XPush setUser:user];
        NSLog(@"XtremePush: setUser called with: %@", user);
    }
#else
    NSLog(@"XtremePush: setUser called but SDK not available: %@", user);
#endif
}

RCT_EXPORT_METHOD(setExternalId:(NSString *)externalId)
{
#if XPUSH_AVAILABLE
    if (externalId && externalId.length > 0) {
        [XPush setExternalId:externalId];
        NSLog(@"XtremePush: setExternalId called with: %@", externalId);
    }
#else
    NSLog(@"XtremePush: setExternalId called but SDK not available: %@", externalId);
#endif
}

RCT_EXPORT_METHOD(requestNotificationPermissions)
{
#if XPUSH_AVAILABLE
    [XPush registerForRemoteNotificationTypes:XPNotificationType_Alert | XPNotificationType_Sound | XPNotificationType_Badge];
    NSLog(@"XtremePush: requestNotificationPermissions called");
#else
    NSLog(@"XtremePush: requestNotificationPermissions called but SDK not available");
#endif
}


@end