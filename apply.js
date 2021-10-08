var PLUGIN_NAME = "cordova-plugin-android-fingerprint-auth";
var GRADLE_PROPERTIES_PATH = "./platforms/android/gradle.properties";
var REGEX = '(android.bundle.enableUncompressedNativeLibs)=(false|true)';
var deferral, fs;

function log(message) {
    console.log(PLUGIN_NAME + ": " + message);
}

function onFatalException(ex) {
    log("EXCEPTION: " + ex.toString());
    deferral.reject();
}

function run() {
    try {
        fs = require('fs');
    } catch (e) {
        throw("Failed to load dependencies: " + e.toString());
    }

    try {
        var gradleProperties = fs.readFileSync(GRADLE_PROPERTIES_PATH).toString();
        var match = getUncompressedNativeLibsEntry(gradleProperties);

        if (!match) {
            gradleProperties += '\nandroid.bundle.enableUncompressedNativeLibs=false';
            log('added enableUncompressedNativeLibs to gradle.properties file');
            log('gradle.properties --> ' + gradleProperties);
        } else if (match[2] === 'true') {
            gradleProperties = gradleProperties.replace(new RegExp(REGEX, 'gm'), '$1=false');
            log('edited value of enableUncompressedNativeLibs to false (was true before)');
            log('gradle.properties --> ' + gradleProperties);
        } else {
            log('enableUncompressedNativeLibs was already found in gradle.properties file');
        }

        fs.writeFileSync(GRADLE_PROPERTIES_PATH, gradleProperties, 'utf8');
        deferral.resolve();
    } catch (e) {
        log('Something failed while adopting the gradle.properties file --> ' + e.message);
        onFatalException(e);
    }
}

function getUncompressedNativeLibsEntry(gradleProperties) {
    return gradleProperties.match(REGEX);
}


function attempt(fn) {
    return function () {
        try {
            fn.apply(this, arguments);
        } catch (e) {
            onFatalException(e);
        }
    };
}

module.exports = function (ctx) {
    try {
        deferral = require('q').defer();
    } catch (e) {
        e.message = 'Unable to load node module dependency \'q\': ' + e.message;
        onFatalException(e);
        throw e;
    }
    attempt(run)();
    return deferral.promise;
};
