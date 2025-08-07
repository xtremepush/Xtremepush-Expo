const {
    withAndroidManifest,
    withProjectBuildGradle,
    withAppBuildGradle,
    withMainApplication,
    withDangerousMod,
    withAppDelegate,
    withXcodeProject,
    withInfoPlist,
    withSettingsGradle,
    withPodfile,
    withEntitlementsPlist,
    IOSConfig
} = require('@expo/config-plugins');

const fs = require('fs');
const path = require('path');


function addLines(content, anchor, lines) {
    if (content.includes(lines[0])) {
        return content;
    }
    return content.replace(anchor, `${anchor}\n${lines.join('\n')}`);
}

const withXPExpoPlugin = (config, pluginConfig) => {
    console.log('Xtremepush Expo Plugin running...');
    console.log('Plugin config:', pluginConfig ? 'provided' : 'default');

    const options = pluginConfig || {};
    const {

        applicationKey = 'DEFAULT_APP_KEY',
        iosAppKey,
        androidAppKey,
        googleSenderId = 'DEFAULT_SENDER_ID',
        enableDebugLogs = false,
        enableLocationServices = true,
        enablePushPermissions = true,

        serverUrl,
        usServerUrl = 'https://sdk.us.xtremepush.com',
        useUsServer = false,
        certificatePath,
        enablePinning = false
    } = options;

    const iosApplicationKey = iosAppKey || applicationKey;
    const androidApplicationKey = androidAppKey || applicationKey;

    // ======== ANDROID ======== 

    config = withSettingsGradle(config, (config) => {
        console.log('Configuring settings.gradle...');
        let content = config.modResults.contents;


        if (content.includes('dependencyResolutionManagement')) {
            if (!content.includes('maven.xtremepush.com')) {
                const repoMatch = content.match(/dependencyResolutionManagement\s*\{\s*[\s\S]*?repositories\s*\{/);
                if (repoMatch) {
                    const insertPoint = repoMatch.index + repoMatch[0].length;
                    content = content.slice(0, insertPoint) +
                        "\n        maven { url 'https://maven.xtremepush.com/artifactory/libs-release-local/' }" +
                        content.slice(insertPoint);
                }
            }
        }

        config.modResults.contents = content;
        console.log('Configured settings.gradle');
        return config;
    });

    config = withProjectBuildGradle(config, (config) => {
        console.log('Configuring project-level build.gradle...');
        let content = config.modResults.contents;


        if (!content.includes('maven.xtremepush.com')) {

            const allProjectsMatch = content.match(/allprojects\s*\{\s*[\s\S]*?repositories\s*\{/);
            if (allProjectsMatch) {
                const insertPoint = allProjectsMatch.index + allProjectsMatch[0].length;
                content = content.slice(0, insertPoint) +
                    "\n        maven { url 'https://maven.xtremepush.com/artifactory/libs-release-local/' }" +
                    content.slice(insertPoint);
            }


            const buildscriptMatch = content.match(/buildscript\s*\{\s*[\s\S]*?repositories\s*\{/);
            if (buildscriptMatch) {
                const insertPoint = buildscriptMatch.index + buildscriptMatch[0].length;
                content = content.slice(0, insertPoint) +
                    "\n        maven { url 'https://maven.xtremepush.com/artifactory/libs-release-local/' }" +
                    content.slice(insertPoint);
            }
        }


        if (!content.includes('com.google.gms:google-services')) {
            const depsMatch = content.match(/buildscript\s*\{\s*[\s\S]*?dependencies\s*\{/);
            if (depsMatch) {
                const insertPoint = depsMatch.index + depsMatch[0].length;
                content = content.slice(0, insertPoint) +
                    "\n        classpath 'com.google.gms:google-services:4.4.2'" +
                    content.slice(insertPoint);
            }
        }

        config.modResults.contents = content;
        console.log('Configured project build.gradle');
        return config;
    });

    config = withAppBuildGradle(config, (config) => {
        console.log('Configuring app-level build.gradle...');
        let content = config.modResults.contents;


        const dependencies = [
            "implementation 'ie.imobile.extremepush:XtremePush_lib:9.3.11'",
            "implementation 'com.google.firebase:firebase-messaging:24.0.3'",
            "implementation 'com.google.android.gms:play-services-location:21.3.0'",
            "implementation 'com.squareup.okhttp3:okhttp:4.12.0'",
            "implementation 'com.squareup:otto:1.3.8'",
            "implementation 'com.google.code.gson:gson:2.11.0'",
            "implementation 'androidx.security:security-crypto:1.0.0'",
            "implementation 'androidx.work:work-runtime:2.9.1'"
        ];


        const depsMatch = content.match(/dependencies\s*\{/);
        if (depsMatch) {
            let insertPoint = depsMatch.index + depsMatch[0].length;
            for (const dep of dependencies) {
                if (!content.includes(dep.split("'")[1])) {
                    content = content.slice(0, insertPoint) +
                        "\n    " + dep +
                        content.slice(insertPoint);
                }
            }
        }


        if (!content.includes("apply plugin: 'com.google.gms.google-services'")) {

            content += "\napply plugin: 'com.google.gms.google-services'\n";
        }

        config.modResults.contents = content;
        console.log('Configured app build.gradle');
        return config;
    });

    config = withMainApplication(config, (config) => {
        console.log('🔨 Configuring MainApplication...');
        let content = config.modResults.contents;
        const packageName = config.android.package;
        const isKotlin = config.modResults.path.endsWith('.kt');

        if (isKotlin) {

            content = addLines(content, `package ${packageName}`, [
                'import ie.imobile.extremepush.PushConnector',
                'import android.util.Log'
            ]);

            if (!content.includes('RNXtremepushReactPackage')) {

                console.log('  Adding RNXtremepushReactPackage to Kotlin MainApplication');
            }
            content = addLines(content, 'val packages = PackageList(this).packages', [
                '      packages.add(RNXtremepushReactPackage())'
            ]);
            const initCode = [
                '    // Initialize XtremePush',
                '    try {',
                '        val builder = PushConnector.Builder("' + androidApplicationKey + '", "' + googleSenderId + '")',
                '            .turnOnDebugLogs(' + enableDebugLogs + ')',
                '        builder.create(this)',
                '        Log.d("MainApplication", "XtremePush initialized successfully!")',
                '    } catch (e: Exception) {',
                '        Log.e("MainApplication", "Failed to initialize XtremePush: " + e.message, e)',
                '    }'
            ].join('\n');
            content = addLines(content, 'super.onCreate()', [initCode]);
        } else { // Java
            content = addLines(content, `package ${packageName};`, [
                'import ie.imobile.extremepush.PushConnector;',
                'import android.util.Log;',
                'import java.util.List;'
            ]);

            content = addLines(content, 'List<ReactPackage> packages = new PackageList(this).getPackages();', [
                '      packages.add(new RNXtremepushReactPackage());'
            ]);
            const initCode = [
                '    // Initialize XtremePush',
                '    try {',
                '        PushConnector.Builder builder = new PushConnector.Builder("' + androidApplicationKey + '", "' + googleSenderId + '")',
                '            .turnOnDebugLogs(' + enableDebugLogs + ');',
                '        builder.create(this);',
                '        Log.d("MainApplication", "XtremePush initialized successfully!");',
                '    } catch (Exception e) {',
                '        Log.e("MainApplication", "Failed to initialize XtremePush: " + e.getMessage(), e);',
                '    }'
            ].join('\n');
            content = addLines(content, 'super.onCreate();', [initCode]);
        }
        config.modResults.contents = content;
        return config;
    });


    config = withAndroidManifest(config, (config) => {
        console.log('Configuring AndroidManifest.xml permissions...');
        const manifest = config.modResults.manifest;


        if (enableLocationServices) {
            const permissions = [
                'android.permission.ACCESS_COARSE_LOCATION',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.ACCESS_BACKGROUND_LOCATION'
            ];

            if (!manifest['uses-permission']) {
                manifest['uses-permission'] = [];
            }

            for (const permission of permissions) {
                const exists = manifest['uses-permission'].some(
                    p => p.$?.['android:name'] === permission
                );
                if (!exists) {
                    manifest['uses-permission'].push({
                        $: { 'android:name': permission }
                    });
                }
            }
        }

        console.log('Configured AndroidManifest.xml');
        return config;
    });

    config = withDangerousMod(config, ['android', async (config) => {
        console.log('Copying Android supporting files...');
        const projectRoot = config.modRequest.projectRoot;
        const packageName = config.android?.package;

        if (!packageName) {
            console.error('Could not determine Android package name');
            return config;
        }

        console.log(`Android package: ${packageName}`);


        const packagePath = packageName.replace(/\./g, '/');
        const javaPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath);
        const kotlinPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'kotlin', packagePath);


        let targetPath = javaPath;
        if (fs.existsSync(kotlinPath)) {

            console.log('Found Kotlin source directory, creating Java directory for React Native modules');
        }


        if (!fs.existsSync(targetPath)) {
            console.log(`Creating directory: ${targetPath}`);
            fs.mkdirSync(targetPath, { recursive: true });
        }

        const moduleSourcePath = path.join(__dirname, 'supporting-files', 'android', 'RNXtremepushReactModule.java');
        const packageSourcePath = path.join(__dirname, 'supporting-files', 'android', 'RNXtremepushReactPackage.java');


        let moduleContent = fs.readFileSync(moduleSourcePath, 'utf8');
        let packageContent = fs.readFileSync(packageSourcePath, 'utf8');


        moduleContent = moduleContent.replace(/package\s+[^;]+;/, `package ${packageName};`);
        packageContent = packageContent.replace(/package\s+[^;]+;/, `package ${packageName};`);


        const moduleDest = path.join(targetPath, 'RNXtremepushReactModule.java');
        const packageDest = path.join(targetPath, 'RNXtremepushReactPackage.java');

        fs.writeFileSync(moduleDest, moduleContent);
        fs.writeFileSync(packageDest, packageContent);

        console.log(`  ✓ Created ${moduleDest}`);
        console.log(`  ✓ Created ${packageDest}`);
        console.log('Copied Android supporting files.');


        const googleServicesPath = path.join(projectRoot, 'android', 'app', 'google-services.json');
        if (!fs.existsSync(googleServicesPath)) {
            console.warn('google-services.json not found. Please add it from Firebase Console to android/app/ directory');
        } else {
            console.log('google-services.json found');
        }

        return config;
    }]);

    // ======== IOS ======== 
    console.log('Starting iOS integration...');

    config = withPodfile(config, (config) => {
        console.log('Configuring iOS Podfile...');
        const podfile = config.modResults;


        if (!podfile.contents.includes("pod 'Xtremepush-iOS-SDK'")) {
            const targetRegex = /target\s+['"][^'"]+['"]\s+do/;
            const match = podfile.contents.match(targetRegex);

            if (match) {
                const insertIndex = match.index + match[0].length;
                const podLine = "\n  pod 'Xtremepush-iOS-SDK'";
                podfile.contents =
                    podfile.contents.slice(0, insertIndex) +
                    podLine +
                    podfile.contents.slice(insertIndex);
                console.log('Added Xtremepush-iOS-SDK pod to Podfile');
            }
        } else {
            console.log('Xtremepush-iOS-SDK pod already in Podfile');
        }

        return config;
    });

    config = withInfoPlist(config, (config) => {
        console.log('Configuring Info.plist...');


        if (!config.modResults.NSBluetoothPeripheralUsageDescription) {
            config.modResults.NSBluetoothPeripheralUsageDescription = 'Using Bluetooth';
            console.log('Added NSBluetoothPeripheralUsageDescription');
        }


        if (enableLocationServices) {
            if (!config.modResults.NSLocationWhenInUseUsageDescription) {
                config.modResults.NSLocationWhenInUseUsageDescription =
                    'This app uses your location to provide personalized content and notifications.';
                console.log('Added NSLocationWhenInUseUsageDescription');
            }
            if (!config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription) {
                config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription =
                    'This app uses your location to provide personalized content and notifications.';
                console.log('Added NSLocationAlwaysAndWhenInUseUsageDescription');
            }
        }


        if (enablePushPermissions) {
            config.modResults.UIBackgroundModes = config.modResults.UIBackgroundModes || [];
            if (!config.modResults.UIBackgroundModes.includes('remote-notification')) {
                config.modResults.UIBackgroundModes.push('remote-notification');
                console.log('Added remote-notification background mode');
            }
        }

        console.log('Configured Info.plist');
        return config;
    });

    config = withEntitlementsPlist(config, (config) => {
        console.log('Configuring iOS Entitlements...');

        // Add push notification entitlement - This is REQUIRED for iOS push notifications
        // The aps-environment will be automatically set by Xcode:
        // - "development" for debug builds
        // - "production" for release/App Store builds
        config.modResults['aps-environment'] = 'development'; // Default, Xcode will override for production
        console.log('Added aps-environment entitlement for push notifications');

        console.log('Configured iOS Entitlements');
        return config;
    });

    config = withAppDelegate(config, (config) => {
        console.log('Configuring AppDelegate...');
        let content = config.modResults.contents;

        if (config.modResults.language === 'swift') {
            console.log('Detected Swift project');


            if (!content.includes('import XPush')) {
                content = 'import XPush\n' + content;
                console.log('    ✓ Added XPush import');
            }


            const methodRegex = /func\s+application\([^)]*didFinishLaunchingWithOptions[^)]*\)\s*->\s*Bool\s*\{/;
            const match = content.match(methodRegex);

            if (match && !content.includes('XPush.setAppKey')) {
                const insertPoint = match.index + match[0].length;
                let initCode = `
        // XtremePush SDK initialization
        print("🔧 XtremePush: Starting SDK initialization...")
        XPush.setAppKey("${iosApplicationKey}")
        print("XtremePush: App key set to: ${iosApplicationKey}")
`;

                if (serverUrl) {
                    initCode += `        XPush.setServerURL("${serverUrl}")\n`;
                } else if (usServerUrl && options.useUsServer) {
                    initCode += `        XPush.setServerURL("${usServerUrl}")\n`;
                }

                initCode += `        #if DEBUG
        print(" XtremePush: DEBUG mode - enabling verbose logging and sandbox mode")
        XPush.setShouldShowDebugLogs(true)
        XPush.setSandboxModeEnabled(true)
        print(" XtremePush: Debug logs enabled, Sandbox mode enabled")
        #endif
`;

                initCode += `        print("XtremePush: Registering for push notifications...")
        XPush.register(forRemoteNotificationTypes: [.alert, .badge, .sound])
        print("XtremePush: Push notification registration request sent")
`;
                initCode += `        print("XtremePush: Calling applicationDidFinishLaunching...")
        XPush.applicationDidFinishLaunching(options: launchOptions)
        print("XtremePush: SDK initialization complete!")
`;

                content = content.slice(0, insertPoint) + initCode + content.slice(insertPoint);
                console.log('    ✓ Added XtremePush initialization to Swift AppDelegate');
            }


            if (!content.includes('didRegisterForRemoteNotificationsWithDeviceToken')) {
                const delegateCode = `
  override public func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    print("XtremePush: Device token received!")
    print("XtremePush: Token length: \\(deviceToken.count) bytes")
    let tokenString = deviceToken.map { String(format: "%02x", $0) }.joined()
    print("XtremePush: Token (hex): \\(tokenString)")
    XPush.applicationDidRegisterForRemoteNotifications(withDeviceToken: deviceToken)
    print("XtremePush: Token sent to XPush SDK")
  }

  override public func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("XtremePush: Failed to register for push notifications")
    print("XtremePush: Error: \\(error.localizedDescription)")
    XPush.applicationDidFailToRegisterForRemoteNotificationsWithError(error)
  }
`;
                const classEndMatch = content.match(/^}\s*$/m);
                if (classEndMatch) {
                    const insertIndex = classEndMatch.index;
                    content = content.slice(0, insertIndex) + delegateCode + '\n' + content.slice(insertIndex);
                    console.log('Added push notification delegate methods to Swift AppDelegate');
                } else {
                    console.error('Could not find proper insertion point for delegate methods');
                    console.error('You may need to manually add the push notification delegate methods');
                }
            }

        } else {
            console.log('Detected Objective-C project');


            if (!content.includes('#import <XPush/XPush.h>')) {
                content = '#import <XPush/XPush.h>\n' + content;
                console.log('Added XPush import');
            }


            const methodRegex = /-\s*\(BOOL\)application:\(UIApplication\s*\*\)application\s+didFinishLaunchingWithOptions:\(NSDictionary\s*\*\)launchOptions\s*\{/;
            const match = content.match(methodRegex);

            if (match && !content.includes('[XPush setAppKey:')) {
                const insertPoint = match.index + match[0].length;
                let initCode = `
    // XtremePush SDK initialization
    NSLog(@"XtremePush: Starting SDK initialization...");
    [XPush setAppKey:@"${iosApplicationKey}"];
    NSLog(@"XtremePush: App key set to: ${iosApplicationKey}");
`;

                if (serverUrl) {
                    initCode += `    [XPush setServerURL:@"${serverUrl}"];\n`;
                } else if (usServerUrl && options.useUsServer) {
                    initCode += `    [XPush setServerURL:@"${usServerUrl}"];\n`;
                }

                initCode += `    #ifdef DEBUG
    NSLog(@"XtremePush: DEBUG mode - enabling verbose logging and sandbox mode");
    [XPush setShouldShowDebugLogs:YES];
    [XPush setSandboxModeEnabled:YES];
    NSLog(@"XtremePush: Debug logs enabled, Sandbox mode enabled");
    #endif
`;

                initCode += `    NSLog(@"XtremePush: Registering for push notifications...");
    [XPush registerForRemoteNotificationTypes:XPNotificationType_Alert | XPNotificationType_Sound | XPNotificationType_Badge];
    NSLog(@"XtremePush: Push notification registration request sent");
`;
                initCode += `    NSLog(@"XtremePush: Calling applicationDidFinishLaunching...");
    [XPush applicationDidFinishLaunching:launchOptions];
    NSLog(@"XtremePush: SDK initialization complete!");
`;

                content = content.slice(0, insertPoint) + initCode + content.slice(insertPoint);
                console.log('Added XtremePush initialization to Objective-C AppDelegate');
            }


            if (!content.includes('didRegisterForRemoteNotificationsWithDeviceToken')) {
                const delegateCode = `
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    NSLog(@"XtremePush: Device token received!");
    NSLog(@"XtremePush: Token length: %lu bytes", (unsigned long)deviceToken.length);
    NSString *tokenString = [self stringFromDeviceToken:deviceToken];
    NSLog(@"XtremePush: Token (hex): %@", tokenString);
    [XPush applicationDidRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
    NSLog(@"XtremePush: Token sent to XPush SDK");
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    NSLog(@"XtremePush: Failed to register for push notifications");
    NSLog(@"XtremePush: Error: %@", error.localizedDescription);
    [XPush applicationDidFailToRegisterForRemoteNotificationsWithError:error];
}

- (NSString *)stringFromDeviceToken:(NSData *)deviceToken {
    const unsigned char *bytes = (const unsigned char *)[deviceToken bytes];
    NSMutableString *token = [NSMutableString string];
    for (NSUInteger i = 0; i < [deviceToken length]; i++) {
        [token appendFormat:@"%02x", bytes[i]];
    }
    return token;
}
`;
                const endMatch = content.match(/@end\s*$/);
                if (endMatch) {
                    const insertIndex = endMatch.index;
                    content = content.slice(0, insertIndex) + delegateCode + '\n' + content.slice(insertIndex);
                    console.log('    ✓ Added push notification delegate methods to Objective-C AppDelegate');
                } else {
                    console.error('Could not find @end in Objective-C AppDelegate');
                    console.error('You may need to manually add the push notification delegate methods');
                }
            }

        }

        config.modResults.contents = content;
        console.log('Configured AppDelegate');
        return config;
    });

    config = withDangerousMod(config, ['ios', async (config) => {
        const projectName = config.modRequest.projectName || config.name;
        const iosPath = path.join(config.modRequest.projectRoot, 'ios', projectName);

        if (!fs.existsSync(iosPath)) {
            console.error('iOS project directory not found:', iosPath);
            return config;
        }

        const hSourcePath = path.join(__dirname, 'supporting-files', 'ios', 'RNXtremepushReact.h');
        const mSourcePath = path.join(__dirname, 'supporting-files', 'ios', 'RNXtremepushReact.m');
        const hDestPath = path.join(iosPath, 'RNXtremepushReact.h');
        const mDestPath = path.join(iosPath, 'RNXtremepushReact.m');

        if (fs.existsSync(hSourcePath) && !fs.existsSync(hDestPath)) {
            fs.copyFileSync(hSourcePath, hDestPath);
            console.log('Copied RNXtremepushReact.h to iOS project');
        }

        if (fs.existsSync(mSourcePath) && !fs.existsSync(mDestPath)) {
            fs.copyFileSync(mSourcePath, mDestPath);
            console.log('Copied RNXtremepushReact.m to iOS project');
        }

        console.log('iOS native files copied successfully');
        return config;
    }]);

    config = withXcodeProject(config, (config) => {
        console.log('Adding files to Xcode project...');
        const project = config.modResults;
        const projectName = config.modRequest.projectName || config.name;

        if (!projectName) {
            console.error('Could not determine project name');
            console.error('CRITICAL: You MUST manually add RNXtremepushReact.h and RNXtremepushReact.m to your Xcode project');
            return config;
        }

        try {

            const projectObj = project.getFirstProject();
            const target = project.getFirstTarget();

            if (!projectObj || !target) {
                throw new Error('Could not access Xcode project structure');
            }

            const mainGroupKey = projectObj.firstProject.mainGroup;
            const targetKey = target.uuid;


            const hFilePath = `${projectName}/RNXtremepushReact.h`;
            if (!project.hasFile(hFilePath)) {
                // Add file to project (creates file reference)
                const hFileRef = project.addFile(hFilePath, mainGroupKey, { lastKnownFileType: 'sourcecode.c.h' });
                console.log('Added RNXtremepushReact.h to project');
            } else {
                console.log('RNXtremepushReact.h already in project');
            }


            const mFilePath = `${projectName}/RNXtremepushReact.m`;
            if (!project.hasFile(mFilePath)) {

                const mFileRef = project.addSourceFile(mFilePath, { lastKnownFileType: 'sourcecode.c.objc' }, mainGroupKey);


                if (mFileRef) {

                    console.log('Added RNXtremepushReact.m to compile sources');
                } else {
                    throw new Error('Failed to get file reference for RNXtremepushReact.m');
                }
            } else {
                console.log('RNXtremepushReact.m already in compile sources');
            }

            console.log('Files successfully added to Xcode project');
            console.log('Native module should now be available in JavaScript');

        } catch (error) {
            console.error('CRITICAL ERROR: Failed to add files to Xcode project:', error.message);
            console.error('This will prevent the React Native bridge from working');
            console.log('');
            console.log(' MANUAL FIX REQUIRED:');
            console.log('    1. Open your iOS project in Xcode');
            console.log('    2. Right-click on your project folder (next to the blue project icon)');
            console.log('    3. Select "Add Files to [ProjectName]"');
            console.log('    4. Navigate to ios/[ProjectName]/ and select BOTH:');
            console.log('       ✓ RNXtremepushReact.h');
            console.log('       ✓ RNXtremepushReact.m');
            console.log('    5. IMPORTANT: Make sure "Add to target" is checked for your main app target');
            console.log('    6. Click "Add"');
            console.log('    7. Clean and rebuild your project');
            console.log('');
        }

        return config;
    });

    config = withDangerousMod(config, ['root', async (config) => {
        const sourcePath = path.join(__dirname, 'xtremepush.js');
        const destPath = path.join(config.modRequest.projectRoot, 'xtremepush.js');

        if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log('Copied xtremepush.js to app root');
        } else if (fs.existsSync(destPath)) {
            console.log('xtremepush.js already exists in app root');
        }

        return config;
    }]);

    console.log('XtremePush Expo Plugin configuration complete!');
    return config;
};

module.exports = withXPExpoPlugin;